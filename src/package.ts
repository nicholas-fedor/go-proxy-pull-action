import type { VersionInfo } from "./version.js";

export interface PackageInfo {
    importPath: string;
    version: string;
}

export function resolvePackage(
    versionInfo: VersionInfo,
    importPath: string,
    repository: string,
): PackageInfo {
    const base = importPath || `github.com/${repository}`;

    let pkg = base;

    if (versionInfo.isSubmodule && versionInfo.submodulePath) {
        pkg = `${pkg}/${versionInfo.submodulePath}`;
    }

    if (versionInfo.majorVersion !== null && versionInfo.majorVersion > 1) {
        pkg = `${pkg}/v${versionInfo.majorVersion}`;
    }

    return {
        importPath: pkg,
        version: versionInfo.version,
    };
}
