function redactUrl(value: string): string {
    try {
        const parsed = new URL(value);
        if (parsed.username || parsed.password) {
            parsed.username = "***";
            parsed.password = "***";
            return parsed.toString();
        }
        return value;
    } catch {
        return value.replace(/^(https?:\/\/)[^@/?#]+@/i, "$1***:***@");
    }
}

export function sanitizeProxy(goproxy: string): string {
    return goproxy
        .split(",")
        .map((part) => {
            const trimmed = part.trim();
            if (trimmed === "") return trimmed;
            return redactUrl(trimmed);
        })
        .join(",");
}

export function sanitizeErrorMessage(message: string): string {
    return message.replace(/https?:\/\/[^/@\s]+@/gi, (match) => {
        const scheme = match.slice(0, match.indexOf("://"));
        return `${scheme}://***:***@`;
    });
}

export type ProxyToken =
    | { kind: "url"; href: string }
    | { kind: "direct" }
    | { kind: "off" };

export function parseGoproxy(value: string): ProxyToken[] {
    const parts = value.split(",").map((p) => p.trim()).filter((p) => p.length > 0);
    if (parts.length === 0) {
        throw new Error(`Invalid goproxy: value is empty`);
    }
    return parts.map(parseToken);
}

function parseToken(token: string): ProxyToken {
    const lower = token.toLowerCase();
    if (lower === "direct") return { kind: "direct" };
    if (lower === "off") return { kind: "off" };
    let parsed: URL;
    try {
        parsed = new URL(token);
    } catch {
        throw new Error(`Invalid goproxy URL: "${redactUrl(token)}" is not a valid URL`);
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        throw new Error(`Unsupported protocol: ${parsed.protocol}`);
    }
    const href = parsed.href.replace(/\/+$/, "");
    return { kind: "url", href };
}

export function httpProxyUrls(tokens: ProxyToken[]): string[] {
    const urls: string[] = [];
    for (const token of tokens) {
        if (token.kind !== "url") {
            break;
        }
        urls.push(token.href);
    }
    return urls;
}

export function encodeModulePath(importPath: string): string {
    return importPath.replace(/[A-Z]/g, (ch) => `!${ch.toLowerCase()}`);
}

export function canonicalProxyVersion(version: string): string {
    return /^v/i.test(version) ? version : `v${version}`;
}

export function moduleVersionUrl(
    goproxy: string,
    importPath: string,
    version: string,
    file: "info" | "mod" | "zip",
): string {
    const base = goproxy.replace(/\/+$/, "");
    const encoded = encodeModulePath(importPath);
    const proxyVersion = canonicalProxyVersion(version);
    return `${base}/${encoded}/@v/${proxyVersion}.${file}`;
}
