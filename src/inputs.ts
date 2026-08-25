import * as core from "@actions/core";
import { parseGoproxy } from "./goproxy.js";

export interface ActionInputs {
    goproxy: string;
    importPath: string;
    version: string;
    method: "http" | "go-get";
    retries: number;
    pkgGoDev: boolean;
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

function parseMethod(raw: string): "http" | "go-get" {
    const method = raw || "http";
    if (method !== "http" && method !== "go-get") {
        throw new Error(`Invalid method: "${method}". Use "http" or "go-get".`);
    }
    return method;
}

function parseRetries(raw: string): number {
    const value = raw || "5";
    const retries = Number(value);
    if (!Number.isInteger(retries) || retries < 1) {
        throw new Error(`Invalid retries: "${value}" must be an integer >= 1`);
    }
    return retries;
}

function parsePkgGoDev(raw: string): boolean {
    if (raw === "") return true;
    const lower = raw.toLowerCase();
    if (lower === "true") return true;
    if (lower === "false") return false;
    throw new Error(`Invalid pkg-go-dev: "${raw}" must be true or false`);
}

export function parseInputs(): ActionInputs {
    const goproxy = core.getInput("goproxy", { required: false }) || "https://proxy.golang.org";
    parseGoproxy(goproxy);

    const importPath = validateImportPath(core.getInput("import_path", { required: false }));
    const version = core.getInput("version", { required: false });
    const method = parseMethod(core.getInput("method", { required: false }));
    const retries = parseRetries(core.getInput("retries", { required: false }));
    const pkgGoDev = parsePkgGoDev(core.getInput("pkg-go-dev", { required: false }));

    return { goproxy, importPath, version, method, retries, pkgGoDev };
}
