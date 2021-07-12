const cors = require("cors");
const express = require("express");
const axios = require("axios");
const fs = require("fs");
const config = require("./agent-conf.json");
const { port, instance, useLocalPath } = require("./config-agent");
const { Helper } = require("./repository-agent");

const helper = new Helper();

fs.stat("localRepository", function (err, stat) {
    if (!stat) {
        fs.mkdir(useLocalPath, (err) => {
            if (err) {
                return console.error(err.message);
            }
            console.log("Directory 'localRepository' created successfully!");
        });
    }
});

const registerOnServer = async () => {
    const { serverHost } = config;
    try {
        await instance.post("/notify-agent", {
            host: `http://${serverHost}`,
            port,
        });
        console.log("registration on the server was successful");
        helper.isRegistered = true;
    } catch (e) {
        console.log(`registration on the server failed with an error ${e.message}`);
        setTimeout(registerOnServer(), 10000);
    }
};

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post("/build", async (req, res) => {
    if (!helper.isRegistered) {
        res.status(500).end("build agent is not registered");
        return;
    }

    const { buildId, repoName, commitHash, buildCommand } = req.body;
    try {
        await helper.buildStart(buildId, repoName, commitHash, buildCommand);
        res.end("successfully launched the build");
    } catch (e) {
        console.log("Ошибочка", e.message);
        res.status(500).end(e.message);
    }
});

app.get("/", function (req, res) {
    res.end("I work");
});

app.listen(port, () => {
    console.log(`Build agent started on port ${port}`);
    registerOnServer();
});
