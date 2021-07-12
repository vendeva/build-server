const { instance } = require("./config-server");
const config = require("./server-conf.json");
const axios = require("axios");

const getSettings = async (storage) => {
    try {
        const { data } = await instance.get("/conf");
        storage.settings = data.data;
        console.log("get settings: ", data);
    } catch (e) {
        console.log(`request to YandexApi '/conf' fail with ${e.message}`);
        return;
    }
};

const getBuilds = async () => {
    try {
        const { data } = await instance.get("/build/list");
        return data;
    } catch (e) {
        console.log(`request to YandexApi 'build/list' fail with ${e.message}`);
        return;
    }
};

const startNewBuild = async (commitMessage, commitHash, branchName, authorName) => {
    try {
        await instance.post("/build/request", {
            commitMessage,
            commitHash,
            branchName,
            authorName,
        });
    } catch (e) {
        console.log(`request to YandexApi 'build/request' fail with ${e.message}`);
        return;
    }
};

const startBuildByApi = async (agent, params) => {
    console.log(`start build on agent ${agent.url}`);
    console.log(params);
    console.log(agent.start.toISOString());
    // Проверка работает ли билд агент
    try {
        const { data } = await axios.get(`${agent.url}`);
        console.log("the agent answer", data);
    } catch (e) {
        console.log("the agent did not work", e.message);
        return;
    }

    try {
        await instance.post("/build/start", {
            buildId: params.buildId,
            dateTime: agent.start.toISOString(),
        });
    } catch (e) {
        console.log(`request to YandexApi 'build/start' fail with ${e.message}`);
        return;
    }

    try {
        const { data } = await axios.post(`${agent.url}/build`, params);
        console.log(`build agent end build with answer: ${data}`);
    } catch (e) {
        console.log("the agent did not take the build to work", e.message);
        return;
    }
};

const finishBuildByApi = async (buildId, start, success, buildLog) => {
    const end = new Date();
    const duration = Math.round((end.getTime() - start.getTime()) / 60000);
    console.log(buildId, start, success, buildLog);
    try {
        await instance.post("/build/finish", {
            buildId,
            duration,
            success,
            buildLog: JSON.stringify(buildLog),
        });
    } catch (e) {
        console.log(`request to YandexApi 'build/finish' fail with ${e.message}`);
        return;
    }
};

module.exports = {
    getSettings,
    getBuilds,
    startNewBuild,
    startBuildByApi,
    finishBuildByApi,
};
