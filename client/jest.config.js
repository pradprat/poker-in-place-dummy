module.exports = {
  roots: ["<rootDir>/src"],
  transform: {
    "^.+\\.(t|j)sx?$": "ts-jest",
  },
  testEnvironment: "node",
  testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$",
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  snapshotSerializers: ["enzyme-to-json/serializer"],
  setupFiles: ["<rootDir>/src/setupTests.ts"],
  reporters: ["default", "jest-junit"],
  moduleNameMapper: {
    "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$": "<rootDir>/__mocks__/fileMock.js",
    "\\.(css|less)$": "<rootDir>/__mocks__/styleMock.js"
  },
  modulePathIgnorePatterns: ["<rootDir>/src/twilio/", "testHelpers.ts"],
  // We don't need to test the static JSX in the icons folder, so let's exclude it from our test coverage report
  coveragePathIgnorePatterns: ["node_modules", "src/icons"],
};