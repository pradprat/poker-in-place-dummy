import React, { memo } from "react";

import LocalVideoPreview from "../../../twilio/components/LocalVideoPreview/LocalVideoPreview";

const MockSeatVideo = (): JSX.Element => (
  <div className="seat-video">
    <LocalVideoPreview />
  </div>
);

export default memo(MockSeatVideo);