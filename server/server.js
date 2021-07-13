const express = require("express");
const cors = require("cors");
const axios = require("axios");
const fs = require("fs");
const { port, useAgentsFile, execFilePromise } = require("./config-server");
const { Storage } = require("./storage-server");
const { getSettings, getBuilds, startNewBuild } = require("./yandexApi");
const { FREE, BUSY } = require("./constants.js");

const storage = new Storage();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

(async () => {
    let currentSettings = storage.settings;
    await getSettings(storage);
    // Читаем список агентов в файле JSON
    fs.stat(useAgentsFile, async (err, stat) => {
        if (stat) {
            let getDataAgents = JSON.parse(await fs.promises.readFile(useAgentsFile));
            await execFilePromise("rm", ["-rf", useAgentsFile]);
            // Проверка работают ли билд агенты
            Object.values(getDataAgents).forEach(async (agent) => {
                try {
                    const { data } = await axios.get(`${agent.url}`);
                    if (data === "I am wait") {
                        agent.status = FREE;
                        agent.buildId = null;
                        agent.status = null;
                    }
                    storage.registerAgent(`${agent.url}`, agent.status, agent.buildId, agent.start);
                    agent;
                } catch (e) {
                    console.log("Build agent not work " + e.message);
                }
            });
        }
    });

    let timerId;
    // Поиск новых коммитов в репозитории
    const updateRepoByNewCommits = async () => {
        console.log("Check last commit in repo");
        clearTimeout(timerId);
        await getSettings(storage);
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
            console.log(`In this branch not found commits: ${e.message}`);
            return;
        }
        const { data } = res;
        if (
            (data && storage.lastCommitHash !== data[0].sha) ||
            JSON.stringify(currentSettings) !== JSON.stringify(storage.settings)
        ) {
            currentSettings = storage.settings;
            storage.lastCommitHash = data[0].sha;
            const commitMessage = data[0].commit.message;
            const authorName = data[0].author.login;
            console.log("Last commit " + storage.lastCommitHash);
            console.log("In this branch new commit, try add build to the queue");
            //Вернуть!!
            //await startNewBuild(commitMessage, storage.lastCommitHash, mainBranch, authorName);
        }

        timerId = setTimeout(updateRepoByNewCommits, +period * 60000);
    };
    await updateRepoByNewCommits();

    // Поиск билдов в статусе Waiting
    const updateBuilds = async () => {
        console.log("Attempt to update builds");
        await getSettings(storage);
        if (storage.settings.repoName === null) return;

        const { data } = await getBuilds();

        storage.searchWaitingBuilds(data);
        //Вернуть!
        setTimeout(updateBuilds, 30000);
    };
    await updateBuilds();
})();

app.post("/notify-agent", async (req, res) => {
    const { host, port } = req.body;
    const url = `${host}:${port}`;

    console.log(`Agent ${url} need to register`);

    const checkAgent = storage.agents.find((agent) => agent.url === `${url}`);
    if (checkAgent) {
        storage.changeAgentStatus(checkAgent, FREE);
    }

    storage.registerAgent(url);

    res.end("");
});

app.post("/notify-build-result", async (req, res) => {
    const { buildId, success, buildLog } = req.body;
    try {
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
