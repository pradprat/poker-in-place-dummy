import React, { useState } from "react";
import styled from "styled-components";

const DisclaimerContainer = styled.div`
  flex-grow: 0;
  padding: 0px 20px;
  padding-bottom: 10px;
`;

const DislcaimerReadMoreLink = styled.a`
  color: #1890ff;
  text-decoration: none;
`;

const Disclaimer = () => {
  const [lines, setLines] = useState(5);

  return (
    <DisclaimerContainer />
  );
};

export default Disclaimer;
