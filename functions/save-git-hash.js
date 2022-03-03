const { gitDescribeSync } = require("git-describe");
const { writeFileSync } = require("fs");
const path = require("path");

const info = gitDescribeSync();
const infoJson = JSON.stringify(
    { ...info, timestamp: new Date().toISOString() },
    null,
    2
);

writeFileSync(path.join(__dirname, "/git-hash.json"), infoJson);
