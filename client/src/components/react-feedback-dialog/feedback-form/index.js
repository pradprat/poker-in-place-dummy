import React, { useState } from "react";
import styled from "styled-components";
import { TextField } from "@material-ui/core"

import Disclaimer from "./disclaimer";
import AddImage from "./add-image";

const Container = styled.div`
  display: flex;
  flex-flow: column nowrap;
  height: 100%;
  overflow: scroll;
`;

const Label = styled.label`
  color: ${props => (props.status === "success" ? "green" : "red")};
  margin-bottom: 1rem;
  visibility: visible;
  opacity: 1;
`;

const FeedbackForm = ({ description, setDescription, email, setEmail, screenshot, message }) => (
  <Container>
    {message !== null &&
        (message.status == "success" || message.status == "error") && (
      <Label status={message.status}>{message.text}</Label>
    )}
    <TextField
      onChange={(event) => setDescription(event.currentTarget.value)}
      placeholder="Please let us known any positive (or constructive) feedback you may have..."
      multiline
      rows={5}
      variant="outlined"
      autoFocus
    />
    <TextField
      onChange={(event) => setEmail(event.currentTarget.value)}
      placeholder="Add your email if you would like a response"
      variant="outlined"
    />
    <AddImage screenshot={screenshot} />
  </Container>
);

export default FeedbackForm;
