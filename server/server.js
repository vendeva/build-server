const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { port, useLocalPath, useLogsPath } = require("./config-server");
const { Storage } = require("./storage-server");
const { getSettings, getBuilds, startNewBuild } = require("./yandexApi");

const storage = new Storage();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

(async () => {
    await getSettings(storage);
    let timerId;
    // Поиск новых коммитов в репозитории
    const updateRepoByNewcommits = async () => {
        console.log("check last commit in repo");
        clearTimeout(timerId);
        const { repoName, mainBranch, period } = storage.settings;
        if (repoName === null) return;
        let res;
        try {
            res = await axios.get(`https://api.github.com/repos/vendeva/yandex_task1/commits`, {
                params: {
                    sha: `${mainBranch}`,
                    access_token: "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",
                },
            });
        } catch (e) {
            console.log(`in this branch not found commits: ${e.message}`);
            return;
        }
        const { data } = res;
        if (data && storage.lastCommitHash !== data[0].sha) {
            storage.lastCommitHash = data[0].sha;
            const commitMessage = data[0].commit.message;
            const authorName = data[0].author.login;
            console.log(storage.lastCommitHash);
            console.log("in this branch new commit, try add build to the queue");
            //Вернуть!!
            await startNewBuild(commitMessage, storage.lastCommitHash, mainBranch, authorName);
        }

        timerId = setTimeout(updateRepoByNewcommits, +period * 60000);
    };
    await updateRepoByNewcommits();

    // Поиск билдов в статусе Waiting
    const updateBuilds = async () => {
        console.log("attempt to update builds");

        if (storage.settings.repoName === null) return;

        const { data } = await getBuilds();

        await storage.searchWaitingBuilds(data);
        //Вернуть!
        setTimeout(updateBuilds, 30000);
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
    try {
        console.log(buildId, success, buildLog);
        await storage.buildFinish(buildId, success, buildLog);
        res.end("");
    } catch (e) {
        console.log(e.message);
        res.status(500).end(e.message);
    }
});

app.listen(port, () => {
    console.log(`Build server started on port ${port}`);
});
