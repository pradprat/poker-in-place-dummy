module.exports = {
  roots: ["<rootDir>/src"],
  transform: {
    "^.+\\.(t|j)sx?$": "ts-jest",
  },
  testEnvironment: "node",
  testRegex: "(/__tests__/.*|(\\.|/)(test))\\.ts$",
  moduleFileExtensions: ["ts", "tsx", "js"],
  reporters: ["default"],
  coveragePathIgnorePatterns: ["node_modules"],
};