export interface VersionInfo {
    tag: string;
    version: string;
    isSubmodule: boolean;
    submodulePath: string;
    majorVersion: number | null;
}

export function parseVersion(githubRef: string): VersionInfo {
    const tag = githubRef.replace(/^refs\/tags\//, "");
    const version = tag.split("/").pop() ?? "";

    const isSubmodule = version !== tag;
    const submodulePath = isSubmodule ? tag.slice(0, tag.lastIndexOf("/")) : "";

    const majorVersion = extractMajorVersion(version);

    return { tag, version, isSubmodule, submodulePath, majorVersion };
}

function extractMajorVersion(version: string): number | null {
    // Strip leading 'v' prefix
    const stripped = version.replace(/^v/, "");
    // Extract the major portion (before first dot)
    const majorStr = stripped.split(".")[0];
    if (majorStr === "") return null;

    const major = Number(majorStr);
    if (!Number.isInteger(major) || major < 0) return null;

    return major;
}
