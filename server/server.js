const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { port, useLocalPath, useLogsPath } = require("./config-server");
const { Storage } = require("./storage-server");
const { getSettings, getBuilds } = require("./yandexApi");

const storage = new Storage();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

(async () => {
    await getSettings(storage);
    const updateBuilds = async () => {
        console.log("attempt to update builds");

        if (storage.settings.repoName === null) return;

        const { data } = await getBuilds();

        await storage.searchWaitingBuilds(data);
        //Вернуть!
        //setTimeout(updateBuilds, 10000);
    };
    await updateBuilds();
})();

app.post("/notify-agent", async (req, res) => {
    const { host, port } = req.body;
    console.log(host, port);
    storage.registerAgent(host, port);
    console.log(storage.agents);

    res.end("");
});

app.post("/notify-build-result", async (req, res) => {
    const { buildId, success, buildLog } = req.body;

    await state.finishBuildOnAgent(buildId, success, buildLog);

    res.end("");
});

app.listen(port, () => {
    console.log(`Build server started on port ${port}`);
});
