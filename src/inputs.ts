import * as core from "@actions/core";

export interface ActionInputs {
    goproxy: string;
    importPath: string;
}

function validateProxyURL(url: string): string {
    try {
        const parsed = new URL(url);
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
            throw new Error(`Unsupported protocol: ${parsed.protocol}`);
        }
        return parsed.href;
    } catch (err) {
        if (err instanceof TypeError) {
            throw new Error(`Invalid goproxy URL: "${url}" is not a valid URL`);
        }
        throw err;
    }
}

function validateImportPath(path: string): string {
    if (path === "") return "";
    if (/\s/.test(path)) {
        throw new Error(`Invalid import_path: "${path}" contains whitespace`);
    }
    if (path.includes("://")) {
        throw new Error(`Invalid import_path: "${path}" should not include a protocol scheme`);
    }
    return path;
}

export function parseInputs(): ActionInputs {
    const rawProxy = core.getInput("goproxy", { required: false }) || "https://proxy.golang.org";
    const goproxy = validateProxyURL(rawProxy);

    const rawImportPath = core.getInput("import_path", { required: false });
    const importPath = validateImportPath(rawImportPath);

    return { goproxy, importPath };
}
