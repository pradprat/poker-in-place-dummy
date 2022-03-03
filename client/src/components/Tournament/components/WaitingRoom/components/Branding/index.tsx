import React, { memo, FunctionComponent } from "react";
import { MessageBox } from "react-chat-elements";

import useChat from "../../../../../../hooks/useChat";
import { MiscOverrides } from "../../../../../../theme";

import { IBrandingProps } from "./interface";
import CountdownTimer from "./components/CountdownTimer";

import "./styles.css";

const miscOverrides = MiscOverrides[window.location.hostname];
const tableLogo =
  miscOverrides && miscOverrides.tableLogo
    ? miscOverrides.tableLogo
    : "/images/logotype-white.png";

const Branding: FunctionComponent<IBrandingProps> = ({ tournament }) => {
  const { contentMessage } = useChat();

  const backgroundImageUrl = tournament.branding?.registrationImageUrl || tableLogo
  const showTimer = tournament?.startTime > new Date().getTime();

  return (
    <div
      className={`branding ${contentMessage || showTimer ? "large" : ""}`}
    >
      <div
        className="content"
        style={{ backgroundImage: `url(${backgroundImageUrl})` }}
      >
        {showTimer && <CountdownTimer endTime={tournament.startTime} />}
        {contentMessage && <MessageBox {...contentMessage} text="" />}
      </div>
    </div>
  );
}

export default memo(Branding);