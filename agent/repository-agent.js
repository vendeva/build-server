const cors = require("cors");
const express = require("express");
const axios = require("axios");
const config = require("./agent-conf.json");
const {
    instance,
    execPromise,
    execFilePromise,
    useLocalPath,
    useLogsPath,
} = require("./config-agent");

class Helper {
    constructor() {
        this.isRegistered = false;
    }

    buildStart = async (buildId, repoName, commitHash, buildCommand) => {
        console.log(buildId, repoName, commitHash, buildCommand);
        await execFilePromise("rm", ["-rf", "localRepository/"]);
        await execFilePromise("git", ["clone", repoName, "localRepository"]);
        await execFilePromise("git", ["checkout", commitHash], {
            cwd: useLocalPath,
        });
        console.log("началась сборка...");
        await execPromise("npm ci", {
            cwd: useLocalPath,
        });
        console.log("установлены зависимости...");
        const { stdout, stderr } = await execPromise(`${buildCommand}`, {
            cwd: useLocalPath,
        });
        const buildLog = `${stdout} ${stderr}`;

        await this.sendResultServer(buildId, true, buildLog);
    };

    async sendResultServer(buildId, success, buildLog) {
        console.log("send results on build server...");

        try {
            await instance.post("/notify-build-result", {
                buildId,
                success,
                buildLog,
            });

            console.log("the data was sent successfully");
        } catch (e) {
            console.log(e.message);
            //setTimeout(this.sendResultServer, 10000);
        }
    }
}

module.exports = { Helper };
