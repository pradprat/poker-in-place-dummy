import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from "react";
import firebase from "firebase";

import useCustomCompareEffect from "../useCustomCompareEffect";
import { ITournamentDetails, IMessage } from "../../engine/types";
import { useAppState } from "../../twilio/state";

export enum MessageType {
  SYSTEM = "system",
  TEXT = "text",
}

export interface IChatContext {
  messages: any[];
  newMessageCount: number;
  contentMessage: any;
  onSendMessage: { (message: string, type: MessageType, payload?: any): void };
  setMessagesRead: { (): void };
}
export const ChatContext = createContext<IChatContext>(null);

function transformMessage(tournament: ITournamentDetails, m: any) {
  return {
    uid: m.uid,
    title: tournament.players[m.uid]
      ? tournament.players[m.uid].name
      : m.username,
    avatar: tournament.players[m.uid]
      ? tournament.players[m.uid].photoURL ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(
        tournament.players[m.uid].name
      )}`
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(m.username)}`,
    type: m.type || "text",
    text: m.message,
    date: new Date(m.timestamp),
    data: m.data,
    timestamp: m.timestamp,
  };
}

interface IChatMessage {
  uid: any;
  title: any;
  avatar: string;
  type: any;
  text: any;
  date: Date;
  data: any;
  timestamp: any;
}

interface ChatProps {
  tournament?: ITournamentDetails;
  currentUserId?: string;
  children: ReactNode;
}
export function ChatProvider({
  tournament,
  currentUserId,
  children,
}: ChatProps) {
  // Watch changes to the messages
  const [messages, setMessages] = useState<IChatMessage[]>([]);
  const [serverMessages, setServerMessages] = useState<IMessage[]>([]);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const [lastMessageTimestamp, setLastMessageTimestamp] = useState(0);
  const [contentMessage, setContentMessage] = useState(null);
  const lastMessageTimestampRef = React.useRef(0);
  lastMessageTimestampRef.current = lastMessageTimestamp;
  const { user } = useAppState();

  // const tournamentUsers =
  useCustomCompareEffect(
    () => {
      setMessages(serverMessages.map((m) => transformMessage(tournament, m)));
    },
    { serverMessages, tournament },
    (before, after) => {
      const playerNamesBefore =
        before.tournament &&
        Object.values(before.tournament.players)
          .map((p) => p.name)
          .sort()
          .join(",");
      const playerNamesAfter =
        after.tournament &&
        Object.values(after.tournament.players)
          .map((p) => p.name)
          .sort()
          .join(",");
      return (
        before.serverMessages.length === after.serverMessages.length &&
        before.serverMessages[0]?.timestamp === after.serverMessages[0]?.timestamp &&
        playerNamesBefore === playerNamesAfter
      );
    }
  );

  const tournamentId = tournament?.id;
  const isPlayerRegistered = !!tournament?.players[currentUserId];
  useEffect(() => {
    if (tournamentId && isPlayerRegistered) {
      const messagesRef = firebase
        .firestore()
        .collection("tournaments")
        .doc(tournamentId)
        .collection("messages")
        .orderBy("timestamp", "desc")
        .limit(100);
      const unwatchMessages = messagesRef.onSnapshot(
        (messagesSnapshot) => {
          const newMessages = messagesSnapshot.docs
            .reverse()
            .map((doc) => doc.data() as IMessage);
          // let filterLastMessageTimestamp = lastMessageTimestamp;
          // setLastMessageTimestamp(maxNewMessage);
          // filterLastMessageTimestamp = maxNewMessage;
          const newMessageCountSet = newMessages.filter(
            (msg) => msg.timestamp > lastMessageTimestampRef.current
            //  && msg.timestamp > filterLastMessageTimestamp
          ).length;
          setServerMessages(newMessages);
          setNewMessageCount(newMessageCountSet);
        },
        (error) => {
          console.error(error);
          // setError({ message: "Error Loading Table" } as TwilioError);
        }
      );

      const systemMessagesRef = firebase
        .firestore()
        .collection("tournaments")
        .doc(tournament.id)
        .collection("messages")
        .where("type", "==", MessageType.SYSTEM)
        .where("data.hasContent", "==", true)
        .orderBy("timestamp", "desc")
        .limit(1);
      const unwatchRecentSystemMessage = systemMessagesRef.onSnapshot(
        (messagesSnapshot) => {
          const newestContentMessage = messagesSnapshot.docs
            .map((doc) => doc.data() as IMessage)
            .map((m) => transformMessage(tournament, m))[0];
          setContentMessage(newestContentMessage);
        }
      );
      return () => [unwatchRecentSystemMessage(), unwatchMessages()];
    }
    return () => { };
  }, [tournamentId, isPlayerRegistered]);

  const onSendMessage = React.useCallback(
    (message: string, type: MessageType, payload = {}) => {
      if (message) {
        firebase
          .firestore()
          .collection("tournaments")
          .doc(tournamentId)
          .collection("messages")
          .add({
            uid: currentUserId,
            username: user.displayName,
            message,
            data: payload,
            timestamp: new Date().getTime(),
            type,
          });
      }
    },
    [tournamentId, currentUserId]
  );

  const setMessagesRead = React.useCallback(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage) {
      setLastMessageTimestamp(lastMessage.timestamp);
    }
    setNewMessageCount(0);
  }, [messages]);

  return (
    <ChatContext.Provider
      value={{
        messages,
        onSendMessage,
        newMessageCount,
        contentMessage,
        setMessagesRead,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export default function useChat() {
  return (
    useContext(ChatContext) || {
      messages: [],
      onSendMessage: null,
      contentMessage: null,
      setMessagesRead: null,
      newMessageCount: 0,
    }
  );
}
