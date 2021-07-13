const axios = require("axios");
const https = require("https");
const util = require("util");
const path = require("path");
const { execFile, exec } = require("child_process");
let { port, serverHost } = require("./agent-conf.json");
const server = require("../server/config-server");

port = process.env["PORT"] || port;

module.exports = {
    port,
    instance: axios.create({
        baseURL: `http://${serverHost}:${server.port}`,
        timeout: 5000,
        httpsAgent: new https.Agent({
            rejectUnauthorized: false,
        }),
    }),
    useLocalPath: path.resolve(__dirname, "localRepository"),
    useAgentPath: path.resolve(__dirname, `localRepository/Agent_${port}`),
    execFilePromise: util.promisify(execFile),
    execPromise: util.promisify(exec),
};
