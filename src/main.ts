import * as core from "@actions/core";
import { parseInputs } from "./inputs.js";
import { parseVersion } from "./version.js";
import { resolvePackage } from "./package.js";
import { pullToProxy } from "./proxy.js";

async function main(): Promise<void> {
    try {
        const { goproxy, importPath } = parseInputs();

        const githubRef = process.env.GITHUB_REF;
        if (!githubRef) {
            core.setFailed("GITHUB_REF is not set");
            return;
        }

        const repository = process.env.GITHUB_REPOSITORY;
        if (!repository) {
            core.setFailed("GITHUB_REPOSITORY is not set");
            return;
        }

        const versionInfo = parseVersion(githubRef);
        core.info(`Tag: ${versionInfo.tag}`);
        core.info(`Version: ${versionInfo.version}`);
        if (versionInfo.isSubmodule) {
            core.info(`Submodule path: ${versionInfo.submodulePath}`);
        }

        const pkg = resolvePackage(versionInfo, importPath, repository);
        core.info(`Package: ${pkg.importPath}@${pkg.version}`);
        core.info(`Proxy: ${goproxy}`);

        const result = await pullToProxy(pkg.importPath, pkg.version, goproxy);

        if (result.exitCode !== 0) {
            core.setFailed(`go get failed for ${pkg.importPath}@${pkg.version}`);
            return;
        }

        core.notice(`Successfully pulled ${pkg.importPath}@${pkg.version} to proxy`);
    } catch (err) {
        if (err instanceof Error) {
            core.setFailed(err.message);
        } else {
            core.setFailed(String(err));
        }
    }
}

main();
