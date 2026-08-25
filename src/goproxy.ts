export function sanitizeProxy(goproxy: string): string {
    try {
        const proxyUrl = new URL(goproxy);
        if (proxyUrl.username || proxyUrl.password) {
            proxyUrl.username = "***";
            proxyUrl.password = "***";
            return proxyUrl.toString();
        }
    } catch {
        // not a valid URL, return as-is
    }
    return goproxy;
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
        throw new Error(`Invalid goproxy URL: "${token}" is not a valid URL`);
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        throw new Error(`Unsupported protocol: ${parsed.protocol}`);
    }
    const href = parsed.href.replace(/\/+$/, "");
    return { kind: "url", href };
}

export function firstHttpProxy(tokens: ProxyToken[]): string | null {
    const found = tokens.find((t) => t.kind === "url");
    return found && found.kind === "url" ? found.href : null;
}

export function encodeModulePath(importPath: string): string {
    return importPath.replace(/[A-Z]/g, (ch) => `!${ch.toLowerCase()}`);
}

export function moduleVersionUrl(
    goproxy: string,
    importPath: string,
    version: string,
    file: "info" | "mod" | "zip",
): string {
    const base = goproxy.replace(/\/+$/, "");
    const encoded = encodeModulePath(importPath);
    return `${base}/${encoded}/@v/${version}.${file}`;
}
