import React, { useState, memo } from "react";
import { Paper, Tab } from "@material-ui/core";
import TabContext from "@material-ui/lab/TabContext";
import TabList from "@material-ui/lab/TabList";
import TabPanel from "@material-ui/lab/TabPanel";
import {
  PanTool as HandHistoryIcon,
  Chat as ChatIcon,
  ImportExport as ResultsIcon,
} from "@material-ui/icons";

import { ILoggedInUser, ITournamentDetails } from "../../../../engine/types";
import ChatRoom from "../ChatRoom";
import Results from "../Results";
import { WrappedSummaryTable } from "../../../../Summary";
import { useAppDispatch, useAppSelector } from "../../../../store/hooks";
import { setRightDrawerTab } from "../../../../store/features/rightDrawer/rightDrawerSlice";

import { RightDrawerTabs } from "./types";

interface IRightDrawerProps {
  user: ILoggedInUser;
  tournament: ITournamentDetails;
  tableId?: string;
  isOrganizer?: boolean;
}

const RightDrawer = ({ user, tournament, tableId, isOrganizer }: IRightDrawerProps): JSX.Element => {
  const rightDrawerTab = useAppSelector((state) => state.rightDrawer.rightDrawerTab);

  const dispatch = useAppDispatch();

  const setDrawerTab = (tab: RightDrawerTabs): void => {
    dispatch(setRightDrawerTab(tab));
  };

  return (
    <div className="tournament-right-drawer">
      {tournament && (
        <TabContext value={rightDrawerTab}>
          <Paper elevation={1}>
            <TabList
              onChange={(ev, value: string) =>
                setDrawerTab(value as RightDrawerTabs)
              }
              style={{ width: "100%" }}
              variant="fullWidth"
              indicatorColor="primary"
            >
              <Tab
                fullWidth
                key={RightDrawerTabs.Chat}
                value={RightDrawerTabs.Chat}
                label="Chat"
                icon={<ChatIcon />}
                style={{ flex: 1, maxWidth: "none" }}
                data-pup="large-tournament-tab"
              />

              <Tab
                fullWidth
                key={RightDrawerTabs.Results}
                value={RightDrawerTabs.Results}
                label="Results"
                icon={<ResultsIcon />}
                style={{ flex: 1, maxWidth: "none" }}
                data-pup="large-tournament-tab"
              />

              <Tab
                fullWidth
                key={RightDrawerTabs.HandHistory}
                value={RightDrawerTabs.HandHistory}
                label="Hand History"
                icon={<HandHistoryIcon />}
                style={{ flex: 1, maxWidth: "none" }}
                data-pup="large-tournament-tab"
              />
            </TabList>
          </Paper>
          <TabPanel value={RightDrawerTabs.Chat}>
            <div className="chat-side-container">
              <ChatRoom
                tournament={tournament}
                currentUserId={user.uid}
                isOrganizer={isOrganizer}
                embedded
              />
            </div>
          </TabPanel>
          <TabPanel value={RightDrawerTabs.Results}>
            <div className="results-side-container">
              <Results tournament={tournament} />
            </div>
          </TabPanel>
          {tableId && (
            <TabPanel value={RightDrawerTabs.HandHistory}>
              <WrappedSummaryTable gameId={tableId} />
            </TabPanel>
          )}
        </TabContext>
      )}
    </div>
  );
}

export default memo(RightDrawer);