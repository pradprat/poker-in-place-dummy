import React, { useEffect, useState } from "react";
import firebase from "firebase";
import { Launcher } from "react-chat-window";
import { makeStyles, createStyles, Theme } from "@material-ui/core";

import { IGame, IMessage } from "../../engine/types";
import { MiscOverrides } from "../../theme";
import "./Chat.css";

const miscOverrides = MiscOverrides[window.location.hostname];
const title =
  miscOverrides && miscOverrides.title ? miscOverrides.title : "Poker in Place";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    container: {
      "& .sc-header, & .sc-launcher, & .sc-message--content.sent .sc-message--text": {
        background: theme.palette.primary.main,
        backgroundColor: theme.palette.primary.main,
      },
      "& .sc-header--close-button:hover": {
        background: theme.palette.secondary.main,
        backgroundColor: theme.palette.secondary.main,
      },
    },
  })
);

interface IProps {
  gameId: string;
  game: IGame;
  currentUserId: string;
  isOpen: boolean;
}

function Chat(props: IProps) {
  const classes = useStyles();
  const [messages, setMessages] = useState([]);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const [lastMessageTimestamp, setLastMessageTimestamp] = useState(0);
  const [overrideOpen, setOverrideOpen] = useState<boolean>(null);
  const gameRef = React.useRef<IGame>(props.game);
  gameRef.current = props.game;
  const handleClick = () => {
    setOverrideOpen(overrideOpen === null ? !props.isOpen : !overrideOpen);
  };
  useEffect(() => {
    const messagesRef = firebase
      .firestore()
      .collection("tables")
      .doc(props.gameId)
      .collection("messages")
      .orderBy("timestamp", "asc");
    const unwatchMessages = messagesRef.onSnapshot((ms) => {
      const newMessages = ms.docs
        .map((doc) => doc.data() as IMessage)
        .filter((m) => gameRef.current.players[m.uid])
        .map((m) => ({
          author: m.uid === props.currentUserId ? "me" : "them",
          type: "text",
          data: {
            text:
              m.uid === props.currentUserId
                ? m.message
                : `${gameRef.current.players[m.uid].name} - ${m.message}`,
          },
          timestamp: m.timestamp,
        }));
      const maxPriorMessage = messages.reduce(
        (max, msg) => Math.max(max, msg.timestamp),
        0
      );
      const maxNewMessage = newMessages.reduce(
        (max, msg) => Math.max(max, msg.timestamp),
        0
      );
      let filterLastMessageTimestamp = lastMessageTimestamp;
      if (props.isOpen || overrideOpen) {
        setLastMessageTimestamp(maxNewMessage);
        filterLastMessageTimestamp = maxNewMessage;
      }
      const newMessageCountSet = newMessages.filter(
        (msg) =>
          msg.timestamp > maxPriorMessage &&
          msg.timestamp > filterLastMessageTimestamp
      ).length;
      setNewMessageCount(newMessageCountSet);
      setMessages(newMessages);
    });
    return () => unwatchMessages();
  }, [props.gameId, props.currentUserId, props.isOpen, overrideOpen]);

  const sendMessage = (msg: any) => {
    firebase
      .firestore()
      .collection("tables")
      .doc(props.gameId)
      .collection("messages")
      .add({
        uid: props.currentUserId,
        message: msg.data.text || msg.data.emoji,
        timestamp: new Date().getTime(),
      });
  };

  return (
    <div className={`container ${classes.container}`}>
      <Launcher
        agentProfile={{
          teamName: title,
          imageUrl: "/img/logo192.png",
        }}
        onMessageWasSent={sendMessage}
        messageList={messages}
        showEmoji
        isOpen={overrideOpen === null ? props.isOpen : overrideOpen}
        handleClick={handleClick}
        newMessagesCount={newMessageCount}
      />
    </div>
  );
}

export default React.memo(Chat);
