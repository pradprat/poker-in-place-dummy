import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@material-ui/core";

import FeedbackForm from "./feedback-form";
import { onOk } from "./utils/publish";

const FeedbackModal = ({
  onClose,
  description,
  setDescription,
  email,
  setEmail,
  screenshot,
  publishConfig,
  additionalInfo = {}
}) => {
  const [message, setMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <Dialog id="feedback-modal" open fullWidth>
      <DialogTitle>
        <span>Give Feedback</span>
      </DialogTitle>
      <DialogContent>
        <FeedbackForm
          screenshot={screenshot}
          description={description}
          setDescription={setDescription}
          email={email}
          setEmail={setEmail}
          message={message}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary" disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          disabled={isSubmitting}
          onClick={async () => {
            setIsSubmitting(true);
            try {
              const result = await onOk({
                description,
                email,
                additionalInfo,
                screenshot,
                publishConfig,
              });

              if (result.status == "success") {
                setMessage({
                  status: "success",
                  text: "Success! Thank you for your feedback.",
                });
                onClose();
              } else {
                setMessage({
                  status: "error",
                  text: result.message,
                });
              }
            } finally {
              setIsSubmitting(false);
            }
          }}
          color="primary"
        >
          Send Feedback
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FeedbackModal;
