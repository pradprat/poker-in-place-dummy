# Poker in Place

## Where are the latencies

1. Locks + retries
2. Document fetches to compute game state
3. Document subscription size (tournament)
4. Frequent updates + syncs (stack totals, table ids?, state, removed players)

## Thoughts for optimizations

1. Single API server per tournament and lock in memory
2. Cache tables/tournament state in memory
3. Pull the player stacks into own document or list?
4. Limit writes to player state to every X seconds

## Concerns

1. Single server needs to be distributed by tournaments if we hit a large volume
2. Cache invalidation - are there lambda functions that mutate state like joins?
3. ?
4. Does any of the client logic depend on tournament player info or can we have any tournament update save every 5s-10s
