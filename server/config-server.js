const axios = require("axios");
const https = require("https");
const dotenv = require("dotenv");
const path = require("path");
const util = require("util");
const { execFile } = require("child_process");
let { port, apiBaseUrl, apiToken } = require("./server-conf.json");

dotenv.config({
    path: path.resolve(__dirname, ".env"),
});

port = process.env["PORT_SERVER"] || port;
apiToken = process.env["API_TOKEN"] || apiToken;

module.exports = {
    port,
    instance: axios.create({
        baseURL: apiBaseUrl,
        timeout: 5000,
        headers: {
            Authorization: "Bearer " + apiToken,
        },
        httpsAgent: new https.Agent({
            rejectUnauthorized: false,
        }),
    }),
    useLocalPath: path.resolve(__dirname, "localRepository"),
    useLogsPath: path.resolve(__dirname, "logs"),
    execPromise: util.promisify(execFile),
};
