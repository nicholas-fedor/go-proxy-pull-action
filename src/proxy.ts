import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as io from "@actions/io";
import * as os from "node:os";
import * as path from "node:path";
import * as fs from "node:fs";

export interface ProxyResult {
    packagePath: string;
    version: string;
    exitCode: number;
}

export async function pullToProxy(
    importPath: string,
    version: string,
    goproxy: string,
): Promise<ProxyResult> {
    const workDir = fs.mkdtempSync(path.join(os.tmpdir(), "go-proxy-pull-"));
    core.info(`Working directory: ${workDir}`);

    const env = {
        ...process.env,
        GO111MODULE: "on",
        GOPROXY: goproxy,
    };

    try {
        core.info("Initializing dummy module...");
        await exec.exec("go", ["mod", "init", "dummy"], { cwd: workDir, env });

        core.info(`Fetching ${importPath}@${version}...`);
        const exitCode = await exec.exec("go", ["get", `${importPath}@${version}`], {
            cwd: workDir,
            env,
            ignoreReturnCode: true,
        });

        return { packagePath: importPath, version, exitCode };
    } finally {
        core.info("Cleaning up working directory...");
        await io.rmRF(workDir);
    }
}
