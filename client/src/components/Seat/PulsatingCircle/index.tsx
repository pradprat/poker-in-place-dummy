import React, { memo } from "react";

import "./styles.css";

const PulsatingCircle = () => (<>
  <div className="pulsating-circle" style={{ animationDelay: "-0.3s" }} />
  <div className="pulsating-circle" />
</>);

export default memo(PulsatingCircle);