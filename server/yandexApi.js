const { instance } = require("./config-server");
const config = require("./server-conf.json");
const axios = require("axios");

const getSettings = async (storage) => {
    try {
        const { data } = await instance.get("/conf");
        storage.settings = data.data;
        console.log("get settings: ", data);
    } catch (e) {
        console.log(e);
    }
};

const getBuilds = async () => {
    try {
        const { data } = await instance.get("/build/list");
        // console.log("get builds: ", data);
        return data;
    } catch (e) {
        console.log(e);
    }
};

const startBuild = async (agent, params) => {
    console.log(`start build on agent ${agent.url}`);
    console.log(params);
    console.log(agent.start.toISOString());
    // await instance.post("/build/start", {
    //     buildId:  params.buildId,
    //     dateTime: agent.start.toISOString(),
    // });

    try {
        const { data } = await axios.post(`${agent.url}/build`, params);
        console.log(`build agent start build with answer: ${data}`);
    } catch (e) {
        console.log("the agent did not take the build to work", e.message);
    }
};

const finishBuild = async ({ buildId, start, success, buildLog }) => {
    const end = new Date();
    const duration = Math.round((end.getTime() - start.getTime()) / 1000);
    instance.post("/build/finish", {
        buildId,
        duration,
        success,
        buildLog,
    });
};

module.exports = {
    getSettings,
    getBuilds,
    startBuild,
    finishBuild,
};
