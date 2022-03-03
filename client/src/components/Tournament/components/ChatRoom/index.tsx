import React, { memo, FunctionComponent } from "react";
import {
  MessageList,
  Input,
  Button as MessageButton,
} from "react-chat-elements";
import { Link } from "@material-ui/core";
import { Videocam as VideocamIcon } from "@material-ui/icons";

import { useAppState } from "../../../../twilio/state";
import { shimMessageBox } from "../../MessageBox";
import useChat, { MessageType } from "../../../../hooks/useChat";

import { getMeetingLink } from "./utils";
import { IChatRoomProps } from "./interface";

import "react-chat-elements/dist/main.css";

shimMessageBox();

const ChatRoom: FunctionComponent<IChatRoomProps> = (props) => {
  const inputRef = React.createRef<any>();
  const messageRef = React.createRef<any>();

  const { user } = useAppState();
  const { messages, onSendMessage } = useChat();

  const onHandleSendMessage = (message: string, type: MessageType) => {
    onSendMessage(message, type);
  };

  const isZoomEmbed =
    props.allowEmbeddedVideo &&
    !props.isOrganizer &&
    props.tournament.externalVideoConferencingLink &&
    props.tournament.externalVideoConferencingLink.indexOf("zoom") >= 0;

  const shouldRenderJoinLink = !props.embedded &&
    props.tournament.externalVideoConferencingLink &&
    !isZoomEmbed;
  const shouldRenderZoom = !props.embedded &&
    props.tournament.externalVideoConferencingLink &&
    isZoomEmbed

  return (
    <div className="chat-list">
      {shouldRenderJoinLink && (
        <Link
          color="primary"
          className="video-conference"
          href={props.tournament.externalVideoConferencingLink}
          target="_blank"
          style={{ display: "flex" }}
        >
          <VideocamIcon /> Join External Video Conference
        </Link>
      )}
      {shouldRenderZoom && (
        // https://zoom.us/j/99164114419?pwd=cUNwMVpCSExlaTgweStqaHBBcWtndz09
        <iframe
          title="Zoom embedded video"
          className="video-embed"
          src={getMeetingLink(
            props.tournament.externalVideoConferencingLink
          )}
        />
      )}
      <div className="message-list">
        <MessageList
          ref={messageRef}
          className="chat-list"
          toBottomHeight="100%"
          lockable
          downButtonBadge={10}
          dataSource={messages.map((m) => ({
            ...m,
            position: m.uid === user.uid ? "right" : "left",
          }))}
        />
      </div>
      <Input
        placeholder="Type here..."
        multiline={false}
        ref={inputRef}
        rightButtons={
          <MessageButton
            color="white"
            backgroundColor="black"
            text="Send"
            onClick={() => {
              const message = inputRef.current.input.value;
              inputRef.current.input.value = "";
              onHandleSendMessage(
                message,
                props.isOrganizer ? MessageType.SYSTEM : MessageType.TEXT
              );
            }}
          />
        }
        onKeyPress={(ev: React.KeyboardEvent) => {
          if (ev.shiftKey && ev.charCode === 13) {
            return true;
          }
          if (ev.charCode === 13) {
            const message = inputRef.current.input.value;
            inputRef.current.input.value = "";
            onHandleSendMessage(
              message,
              props.isOrganizer ? MessageType.SYSTEM : MessageType.TEXT
            );
            ev.preventDefault();
            return false;
          }
        }}
      />
    </div>
  );
};

export default memo(ChatRoom);
