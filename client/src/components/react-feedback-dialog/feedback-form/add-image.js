import React, { useState } from "react";
import styled from "styled-components";
import {
  Checkbox,
  CircularProgress,
  FormControlLabel,
} from "@material-ui/core";

const AddImageContainer = styled.div`
  flex-grow: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 2rem;
  height: 4rem;
`;

const ImageContainer = styled.div`
  height: 64px;
  width: 64px;
  display: ${(props) => (props.visible ? "flex" : "none")};
  justify-content: center;
  align-items: center;
`;

const Image = styled.img`
  object-fit: contain;
  /* object-fit: fill;  */
  height: auto;
  width: auto;
  min-height: 100%;
  max-height: 100%;
  min-width: 100%;
  max-width: 100%;
  font-size: 14px;
  overflow: hidden;
`;

const AddImage = ({ screenshot, setScreenshot }) => {
  const [isAddScreenshotChecked, setIsAddScreenshotChecked] = useState(true);

  return (
    <AddImageContainer>
      <FormControlLabel
        control={
          <Checkbox
            checked={isAddScreenshotChecked}
            onChange={() => setIsAddScreenshotChecked(!isAddScreenshotChecked)}
          />
        }
        label="Attach a screenshot"
      />
      <ImageContainer visible={isAddScreenshotChecked}>
        {screenshot === null ? (
          <CircularProgress />
        ) : (
          <Image
            height="64"
            width="64"
            alt="Screenshot preview"
            src={screenshot}
          />
        )}
      </ImageContainer>
    </AddImageContainer>
  );
};

export default AddImage;
