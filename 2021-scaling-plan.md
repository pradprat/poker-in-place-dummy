# How it works
1. Components
2. Logic

## Components
1. Client
2. Firestore
3. Server (VM)
4. Server (Media)

### Client
React app that connects to Firestore for a given tournament/table(game) document and reacts to changes made to that document. The state is then rendered to show the table, players, cards, counts, available actions (bet, fold, etc.). Each client connects with WebRTC to a SFU media proxy to stream video to other players at the table. To connect to the media room, a signed token is request from the API to ensure proper access.

When the client takes an action (bet, check, fold), it makes an API call to the server (/respond) which then passes the action to the state machine logic (detailed below).

### Firestore
Firestore is used for storing the documents representing the game state. They are largely organized as follows:

1. Tournaments - the state of a tournament - players, tables, settings, etc.
2. Tables - the state of an individual table - players, table settings, etc.
3. Tables/Hands - the state of different hands at a given table - players, actions (bets, folds), winners, etc.

Firestore is mutated by the API and subscribed to by the client to stream updates that re-render the game state.

### Server (VM)
In an effort to improve performance across large tournaments, each tournament is allocated to 1 of N API servers and all client requests happen on that individual server. The primary reason for all logic on a single VM per tournament was for performance around locking. Will go into more detail regarding locking, updates in the state machine section.

### Server (Media)
An SFU that routed WebRTC media streams from N-to-N clients. The server uses the Mediasoup open source project.

## Logic
NOTE: the logic for the poker engine live in client/src/engine. It is referenced from functions/src as well. There is a step to run to copy the files from client/src/engine to functions/src/engine. Go to the client folder and run `yarn build engine`.
### State machine
The original state machine managed a single table. It would take the current hand, players, game state, and apply a new action to it (bet, check, fold, timer) and output the new state. This new state is then saved off to the various Firestore documents (table, hand).

With tournaments, a layer is added on top of the table state machine. Certain actions trigger tournament-wide actions:

1. Table re-balancing - if a player is booted from the tournament, we consolidate tables to ultimately arrive at a final table. We will move players from one table to another to try and have tables of approximately even amounts.
2. Blind increases - blinds are increased across all tables at once.
3. Pausing - The tournament can be paused to allow for bathroom breaks. If a hand is live when a pause is requested, that hand is allowed to finish.

### API Processing
We have an interval running on the API servers to "move along" all the active tournaments. These timers run on 5 second intervals and take the following action:

1. Load all active tournaments assigned to that server
2. In parallel, "move along" action across each table. This will enforce timeouts, trigger a card to be dealt, assign winners of the hand, and other transitions that are independent of user action.
3. After each table in a tournament is processed, the tournament state as a whole is processed. This will handle tasks such as increasing blinds, pausing the tournament, re-balancing tables, eliminating players.

Each of the actions will lock either the table or the tournament. User actions will also lock the table or the tournament before mutating depending on the action taken. This is to prevent concurrency issues of one update overwriting another.

### User interactions
User interactions happen through the API calls and will mutate the table/tournament state based on the action. The types of user interactions are:

1. Joining the tournament
2. Leaving the tournament
3. Rebuying after losing chips
4. Taking action on a hand (bet, check, fold)

### Caching
To limit the round-tripping to Firestore, there is a caching layer hooked in to all Firestore calls (gets, sets, updates, adds)

NOTE: I have not quantified the impact of this work and it might cause more problems than it solves.

# Opportunities
## Known issues
1. Game state is corrupted at times. This is likely due to either how caching is implemented, or race conditions that the locking of documents is not currently solving.
    a. Duplicated players - We sometimes see a player who gets moved from one table to another duplicated on two tables. This causes rebalancing issues down the road. I am not sure of the causes, but I believe it is related to how we update the players state on the tables.
    b. Stuck hands - sometimes we've seen a table that stops making progress due to some invalid state. I believe these issues are largely fixed, but were due to how we moved players and assigned their position on the table.
2. VPNs - VPNs cause issues connecting to the media servers. They connect on port 4443 which likely is in the blocked range. We could change that.
3. A/V issues - Some browsers run into issues provisioning video streams with WebRTC. This is generally user error, but causes issues. There is an onboarding flow to try and help with this.
4. Player timeouts - Likely due to locking blocking user play, sometimes players will not be able to respond to a hand and will get timed-out and set to away.

## Bug Fixes
1. The fire player to respond often sees their timer start with 5s elapsed. Can we add a little buffer to their time to account for server sync time.
2. Removing no-shows when a tournament is live can cause state issues.
3. Rebuys need testing

# Scaling Plan
Some thoughts on what's needed to help scale
## Auto-fixing

1. Add hand reset on certain error states (ERROR_INVALID_HAND) - can we detect invalid states and just restart the hand while we figure out the root cause.
2. Make no-show removal pause the tournament first, then act - We have a function to CULL no-shows which seems to cause some issues if run when the tournament is live. We should ideally pause the tournament, remove no-shows, then resume the tournament.

## Test Coverage

1. There is very limited test coverage. While the engine logic is relatively well tested, the interactions of how the data is retrieved, processed, saved, cached needs a lot more testing.
2. We need to have better verification of the distributed logic that happens when a tournament runs to help prevent regressions.

## Auto-scaling

1. The infrastructure is currently horizontally scalable across the API and Media servers. There is a Firestore document in admin/config that houses the available API and Media servers and round-robins across them. There is NO logic to de-provision instances. There are scripts to allocate additional VMs.
2. Each VM, Media server has a dedicated IP + DNS which makes auto-scaling difficult. Given the constraint of a tournament running on a single VM for locking/caching, this gets a little tricky to load-balance.

## Product upgrades

1. Easier onboarding
2. Easier management
3. Gameplay management (help rebuys, add late player, etc.)

# Debugging

## Firebase console
https://console.firebase.google.com/u/0/project/poker-in-place-alpha/firestore/data~2Ftables~2F7It0xxIHKa6PN34YKuaC
You can look up the table/tournament ID and then look a the state behind the scenes.

## GCE Stack Driver
1. Look up the apiServerHost for the tournament in question
2. Go to GCE (https://console.cloud.google.com/compute/instances?project=poker-in-place&instancessize=50)
3. Find the appropriate VM host (e.g. alpha-1)
4. Click View Logs - you can see the logs on the host and filter for any errors you want.