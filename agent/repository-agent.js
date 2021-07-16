const path = require("path");
const {
    instance,
    execPromise,
    execFilePromise,
    useLocalPath,
    useAgentPath,
    port,
} = require("./config-agent");
const { exec } = require("child_process");

class Helper {
    constructor() {
        this.isRegistered = false;
        this.work = false;
    }

    buildStart = async (buildId, repoName, commitHash, buildCommand) => {
        if (/rm -rf/.test(buildCommand)) {
            throw new Error("Невалидная команда для сборки");
        }
        console.log("Параметры для сборки:");
        console.log({ buildId, repoName, commitHash, buildCommand });
        await execFilePromise("rm", ["-rf", `Agent_${port}/`], {
            cwd: useLocalPath,
        });
        await execFilePromise("git", ["clone", repoName, `Agent_${port}/`], {
            cwd: useLocalPath,
        });
        await execFilePromise("git", ["checkout", commitHash], {
            cwd: useAgentPath,
        });
        console.log("Началась сборка...");
        await execPromise("npm ci", {
            cwd: useAgentPath,
        });
        console.log("Установлены зависимости...");
        let success, buildLog;
        try {
            const { stdout, stderr } = await execPromise(`${buildCommand}`, {
                cwd: useAgentPath,
            });

            buildLog = `${stdout} ${stderr}`;
            success = true;
        } catch (e) {
            const { stderr } = e;
            buildLog = `${stderr}`;
            success = false;
            console.log("Error, exit code " + e.code);
        }
        await this.sendResultServer(buildId, success, buildLog, 60);
    };

    async sendResultServer(buildId, success, buildLog, n) {
        console.log("Send results on build server...");

        try {
            await instance.post("/notify-build-result", {
                buildId,
                success,
                buildLog,
            });

            console.log("The data was sent successfully");
        } catch (e) {
            console.log(e.message);
            if (n >= 1) {
                await new Promise((resolve) => setTimeout(resolve, 10000));
                if (/ECONNREFUSED/.test(e.message)) {
                    await this.sendResultServer(buildId, success, buildLog, n - 1);
                }
            }
        }
    }
}

module.exports = { Helper };
