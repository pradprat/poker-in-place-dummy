import { configureStore } from "@reduxjs/toolkit";

import rightDrawerReducer from "./features/rightDrawer/rightDrawerSlice";

const store = configureStore({
  reducer: {
    rightDrawer: rightDrawerReducer,
  },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch

export default store;