# Spy view
allow for administrator to view table interactions without sending video

# Rebalancing tables
Tables need to be rebalanced anytime...

Triggering events:
1. Time: Every 5 (10, 15?) minutes rebalance tables to have similar number of players
2. Bust-out and re-buy declined (give 60 seconds to decide to rebuy) or not available

Rebalance logic:
1. Aim for equal numbers across tables
2. Aim for similar distribution of stacks across tables
3. Minimize the number of players moving tables
4. Have smaller and larger rebalances (smaller being one player is out and move one from another table, larger being timed rebalances that focus on stack sizes)

# Overlaying tournament structure

1. List of all players (so they can view tournament details)
2. Player stacks
3. Tables have a tournament reference
4. Moving players between tables deactivates the player from one and adds to another
5. Permissions are granted to table and tournament
6. Ghost admin on each table
7. Tournament actions propagate to all child tables

# Broader rebalancing
1. Pause all games and allow hand to finish (for multi-table shuffling?)
2. Show message that table rebalancing happening
3. Wait for hands to finish, move players, then unpause tables.
4. Moving players should "remove" them from one table and add to another.
5. After each hand, tournament player leaderboards should update with player, table, stack

TODO:
1. Show 45s-60s countdown timer before auto-fold/check
2. Client can auto-fold itself after timeout OR have background worker scanning all active games
3. (NOTE) - may need to timeout "active" games - definitely need to do this