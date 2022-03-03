import React, { useState, useEffect } from "react";

import Modal from "./feedback-modal";
// import Canvas from 'components/react-feedback-dialog/canvas';
import { takeScreenshot } from "./utils/screenshot";

const FeedbackDialog = ({ onClose, publishConfig, open, additionalInfo }) => {
  // const [isCanvasVisible, setIsCanvasVisible] = useState(false);
  // const [isCanvasActive, setIsCanvasActive] = useState(false);
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [screenshot, setScreenshot] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // take screenshot before react-feedback-modal is visible
    if (open) {
      (async function helper(document) {
        const image = await takeScreenshot(document);
        setScreenshot(image);
      })(document).then(() => setShowModal(true));
    } else {
      setScreenshot(null);
      setShowModal(false);
    }
  }, [open]);

  return (
    <div>
      {showModal && (
        <Modal
          onClose={onClose}
          description={description}
          setDescription={setDescription}
          email={email}
          setEmail={setEmail}
          screenshot={screenshot}
          publishConfig={publishConfig}
          additionalInfo={additionalInfo}
        />
      )}
      {/* {isCanvasVisible && (
        <Canvas
          isCanvasActive={isCanvasActive}
          description={description}
          setDescription={setDescription}
          screenshotUrl={screenshotUrl}
          setScreenshotUrl={setScreenshotUrl}
        />
      )} */}
    </div>
  );
};

export default FeedbackDialog;
