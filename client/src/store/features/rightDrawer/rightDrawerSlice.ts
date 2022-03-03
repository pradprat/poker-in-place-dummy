import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { RightDrawerTabs } from "../../../components/Tournament/components/RightDrawer/types";

interface IRightDrawerState {
  shouldShowRightDrawer: boolean;
  rightDrawerTab: RightDrawerTabs;
}

const initialState: IRightDrawerState = {
  shouldShowRightDrawer: false,
  rightDrawerTab: RightDrawerTabs.Chat,
};

export const rightDrawerSlice = createSlice({
  name: "rightDrawer",
  initialState,
  reducers: {
    setShouldShowRightDrawer: (state, action: PayloadAction<boolean>): void => {
      state.shouldShowRightDrawer = action.payload;
      state.rightDrawerTab = initialState.rightDrawerTab;
    },
    setRightDrawerTab: (state, action: PayloadAction<RightDrawerTabs>): void => {
      state.rightDrawerTab = action.payload;
    },
  },
});

export const { setShouldShowRightDrawer, setRightDrawerTab } = rightDrawerSlice.actions;

export default rightDrawerSlice.reducer;