Split tournament into X groups that are managed independently
We can most likely make due with rebalance logic without all the tables (just the players + table ids)
Can also just return the "updates" needed by constructing fake table objects from the player list (id, players, stage?, activehand needs full table) ref, data()

// let autoAdvanceGames = !gameState;
Do something with this when we're in simulation mode

// actions.push({ directive: TournamentDirective.Resume });
Look into when we start, the massive start game resume stuff
We should really just set blinds and get the tables running (more atomically)


// hasTablesWithActiveHands
We need to check to pause/unpause whether or not tables are in the middle of hands
We could store tables with active hands on the tournament itself and just read that (fewer fetches) and updates when players update anyway


Can we process the game state FIRST then any request logic and let the "sweep" handle the rest?
Also, do we need to pause everything to move people around or is locking enough?