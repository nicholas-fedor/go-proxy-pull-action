import * as core from "@actions/core";
import { parseInputs } from "./inputs.js";
import { parseExplicitVersion, parseVersion } from "./version.js";
import { resolvePackage } from "./package.js";
import { pullToProxy } from "./proxy.js";
import { parseGoproxy, sanitizeErrorMessage, sanitizeProxy } from "./goproxy.js";
import { pullViaGoproxyList } from "./http.js";

export { sanitizeProxy };

async function pingPkgGoDev(importPath: string, version: string): Promise<void> {
    const url = `https://pkg.go.dev/${importPath}@${version}`;
    try {
        core.info(`Pinging ${url}`);
        const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
        if (!res.ok) {
            core.warning(`pkg.go.dev returned HTTP ${res.status} for ${url}`);
        }
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        core.warning(`pkg.go.dev ping failed: ${message}`);
    }
}

export async function run(): Promise<void> {
    try {
        const inputs = parseInputs();

        const githubRef = process.env.GITHUB_REF;
        if (!inputs.version && !githubRef) {
            core.setFailed("GITHUB_REF is not set");
            return;
        }

        const repository = process.env.GITHUB_REPOSITORY;
        if (!repository) {
            core.setFailed("GITHUB_REPOSITORY is not set");
            return;
        }

        const versionInfo = inputs.version
            ? parseExplicitVersion(inputs.version)
            : parseVersion(githubRef!);
        core.info(`Tag: ${versionInfo.tag}`);
        core.info(`Version: ${versionInfo.version}`);
        if (versionInfo.isSubmodule) {
            core.info(`Submodule path: ${versionInfo.submodulePath}`);
        }

        const pkg = resolvePackage(versionInfo, inputs.importPath, repository);
        core.info(`Package: ${pkg.importPath}@${pkg.version}`);
        core.info(`Proxy: ${sanitizeProxy(inputs.goproxy)}`);

        const tokens = parseGoproxy(inputs.goproxy);
        let infoUrl = "";

        if (inputs.method === "http") {
            const result = await pullViaGoproxyList(tokens, {
                importPath: pkg.importPath,
                version: pkg.version,
                retries: inputs.retries,
            });
            infoUrl = result.infoUrl;
        } else {
            const result = await pullToProxy(pkg.importPath, pkg.version, inputs.goproxy);
            if (result.exitCode !== 0) {
                core.setFailed(
                    `go get failed for ${pkg.importPath}@${pkg.version} (exit code ${result.exitCode})`,
                );
                return;
            }
        }

        if (inputs.pkgGoDev) {
            await pingPkgGoDev(pkg.importPath, pkg.version);
        }

        core.setOutput("import-path", pkg.importPath);
        core.setOutput("version", pkg.version);
        core.setOutput("info-url", infoUrl);
        core.notice(`Successfully pulled ${pkg.importPath}@${pkg.version} to proxy`);
    } catch (err) {
        if (err instanceof Error) {
            core.setFailed(sanitizeErrorMessage(err.message));
        } else {
            core.setFailed(sanitizeErrorMessage(String(err)));
        }
    }
}

if (import.meta.main || process.argv[1]?.endsWith("index.js")) {
    void run();
}
