const cors = require("cors");
const express = require("express");
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

const registerOnServer = async (n) => {
    const { serverHost } = config;
    try {
        await instance.post("/notify-agent", {
            host: `http://${serverHost}`,
            port,
        });
        console.log("Registration on the server was successful");
        helper.isRegistered = true;
    } catch (e) {
        console.log(`Registration on the server failed with an error ${e.message}`);
        if (n >= 1) {
            await new Promise((resolve) => setTimeout(resolve, 10000));
            await registerOnServer(n - 1);
        }
    }
};

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post("/build", async (req, res) => {
    if (!helper.isRegistered) {
        res.status(500).end("Build agent is not registered");
        return;
    }

    const { buildId, repoName, commitHash, buildCommand } = req.body;
    try {
        helper.work = true;
        await helper.buildStart(buildId, repoName, commitHash, buildCommand);
        helper.work = false;
        res.end("Successfully launched the build");
    } catch (e) {
        console.log("Ошибочка", e.message);
        helper.work = false;
        res.status(500).end(e.message);
    }
});

app.get("/", function (req, res) {
    const action = helper.work ? "work" : "wait";
    res.end(`I am ${action}`);
});

app.listen(port, async () => {
    console.log(`Build agent started on port ${port}`);
    await registerOnServer(60);
});
