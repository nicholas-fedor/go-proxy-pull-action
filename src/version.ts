export interface VersionInfo {
    tag: string;
    version: string;
    isSubmodule: boolean;
    submodulePath: string;
    majorVersion: number | null;
}

const MODULE_VERSION = /^v?\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+incompatible)?$/;

export function isGoModuleVersion(version: string): boolean {
    return MODULE_VERSION.test(version);
}

export function parseVersion(githubRef: string): VersionInfo {
    if (!githubRef.startsWith("refs/tags/")) {
        throw new Error(
            `GITHUB_REF is not a tag (${githubRef}). Pass inputs.version or run this action on a tag.`,
        );
    }
    return parseTagBody(githubRef.slice("refs/tags/".length));
}

export function parseExplicitVersion(version: string): VersionInfo {
    return parseTagBody(version);
}

function parseTagBody(tag: string): VersionInfo {
    const version = tag.split("/").pop() ?? "";
    if (!isGoModuleVersion(version)) {
        throw new Error(`Invalid Go module version: "${version}"`);
    }
    const isSubmodule = version !== tag;
    const submodulePath = isSubmodule ? tag.slice(0, tag.lastIndexOf("/")) : "";
    const majorVersion = extractMajorVersion(version);
    return { tag, version, isSubmodule, submodulePath, majorVersion };
}

function extractMajorVersion(version: string): number | null {
    const stripped = version.replace(/^v/, "");
    const majorStr = stripped.split(".")[0];
    if (majorStr === "") return null;

    const major = Number(majorStr);
    if (!Number.isInteger(major) || major < 0) return null;

    return major;
}
