import React from "react";
import renderer from "react-test-renderer";

import NetworkConnectionStatus from ".";

describe("NetworkQualityLevel component", () => {
  it("should render correctly if isConnected", () => {
    const tree = renderer.create(<NetworkConnectionStatus />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
