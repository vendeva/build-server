const fs = require("fs");
const { BUSY, FREE } = require("./constants.js");
const { useAgentsFile } = require("./config-server");
const { startBuildByApi, finishBuildByApi } = require("./yandexApi");

class Storage {
    constructor() {
        this.settings = {
            id: null,
            repoName: null,
            buildCommand: null,
            mainBranch: null,
            period: null,
        };
        (this.lastCommitHash = null), (this.builds = []), (this.agents = []);
    }

    getAgentByBuildId(buildId) {
        return this.agents.find((agent) => agent.buildId === buildId);
    }

    registerAgent = (url, status = FREE, buildId = null, start = null) => {
        if (this.agents.some((agent) => agent.url === url)) return;

        console.log(`The new agent is working ${url}`);
        const agentParams = {
            url,
            status,
            buildId,
            start,
        };
        this.agents.push(agentParams);
        console.log("All current agents on server:");
        console.log(this.agents);
        fs.stat(useAgentsFile, async (err, stat) => {
            if (!stat) {
                await fs.promises.writeFile(
                    useAgentsFile,
                    JSON.stringify({ [`${url}`]: agentParams })
                );
            } else {
                let data = JSON.parse(await fs.promises.readFile(useAgentsFile));
                data[`${url}`] = agentParams;
                await fs.promises.writeFile(useAgentsFile, JSON.stringify(data));
            }
        });
    };

    searchWaitingBuilds = async (builds) => {
        this.builds = builds.filter((build) => build.status === "Waiting");
        console.log("Waiting builds:");
        console.log(this.builds);
        if (this.builds.length !== 0) {
            await this.searchFreeAgent();
        }
    };

    searchFreeAgent = async () => {
        const freeAgents = this.agents.filter((agent) => agent.status === FREE);
        console.log("Free agents:");
        console.log(freeAgents);
        if (freeAgents.length) {
            console.log("A free agent was found");
            await this.sendBuildToAgent(freeAgents[0]);
        } else {
            console.log("There is no free agent yet");
        }
    };

    sendBuildToAgent = async (agent) => {
        const build = this.builds[0];
        const params = {
            repoName: this.settings.repoName,
            buildCommand: this.settings.buildCommand,
            buildId: build.id,
            commitHash: build.commitHash,
        };

        await this.changeAgentStatus(agent, BUSY, build.id, new Date());
        await startBuildByApi(agent, params);
    };

    changeAgentStatus = async (agent, status, buildId = null, start = null) => {
        agent.status = status;
        agent.buildId = buildId;
        agent.start = start;
        let data = JSON.parse(await fs.promises.readFile(useAgentsFile));
        data[`${agent.url}`] = agent;
        await fs.promises.writeFile(useAgentsFile, JSON.stringify(data));
    };

    buildFinish = async (buildId, success, buildLog) => {
        const agent = this.getAgentByBuildId(buildId);
        console.log(`Agent ${agent.url} has successfully completed work`);
        await finishBuildByApi(buildId, agent.start, success, buildLog);

        this.changeAgentStatus(agent, FREE);
    };
}

module.exports = { Storage };
