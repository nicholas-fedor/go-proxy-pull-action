import * as core from "@actions/core";
import {
    httpProxyUrls,
    moduleVersionUrl,
    sanitizeProxy,
    type ProxyToken,
} from "./goproxy.js";

export interface HttpPullResult {
    infoUrl: string;
    status: number;
    body: string;
}

export interface PullViaHttpOptions {
    goproxy: string;
    importPath: string;
    version: string;
    retries?: number;
    timeoutMs?: number;
    fetchImpl?: typeof fetch;
    sleep?: (ms: number) => Promise<void>;
}

export class HttpStatusError extends Error {
    readonly status: number;

    constructor(message: string, status: number) {
        super(message);
        this.name = "HttpStatusError";
        this.status = status;
    }
}

const RETRYABLE = new Set([404, 410, 429, 500, 502, 503, 504]);
const DEFAULT_DELAYS = [2000, 5000, 10000, 20000, 20000];

function requestUrlAndHeaders(url: string): { url: string; headers: Record<string, string> } {
    const parsed = new URL(url);
    const headers: Record<string, string> = {};
    if (parsed.username || parsed.password) {
        const credentials = `${decodeURIComponent(parsed.username)}:${decodeURIComponent(parsed.password)}`;
        headers.Authorization = `Basic ${Buffer.from(credentials).toString("base64")}`;
        parsed.username = "";
        parsed.password = "";
    }
    return { url: parsed.toString(), headers };
}

async function fetchWithRetry(url: string, opts: PullViaHttpOptions): Promise<Response> {
    const fetchImpl = opts.fetchImpl ?? fetch;
    const sleep = opts.sleep ?? ((ms) => new Promise((r) => setTimeout(r, ms)));
    const retries = opts.retries ?? 5;
    const { url: requestUrl, headers } = requestUrlAndHeaders(url);
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            core.info(`GET ${sanitizeProxy(url)} (attempt ${attempt + 1}/${retries})`);
            const res = await fetchImpl(requestUrl, {
                signal: AbortSignal.timeout(opts.timeoutMs ?? 30_000),
                headers,
            });
            if (res.status === 200) {
                return res;
            }
            lastError = new HttpStatusError(
                `GET ${sanitizeProxy(url)} failed with HTTP ${res.status}`,
                res.status,
            );
            if (!RETRYABLE.has(res.status) || attempt === retries - 1) {
                throw lastError;
            }
        } catch (err) {
            lastError = err instanceof Error ? err : new Error(String(err));
            if (attempt === retries - 1) {
                throw lastError;
            }
            const status = lastError instanceof HttpStatusError
                ? lastError.status
                : Number(/HTTP (\d+)/.exec(lastError.message)?.[1]);
            if (Number.isInteger(status) && !RETRYABLE.has(status)) {
                throw lastError;
            }
        }
        await sleep(DEFAULT_DELAYS[Math.min(attempt, DEFAULT_DELAYS.length - 1)]!);
    }

    throw lastError ?? new Error("unreachable");
}

export async function pullViaHttp(opts: PullViaHttpOptions): Promise<HttpPullResult> {
    const infoUrl = moduleVersionUrl(opts.goproxy, opts.importPath, opts.version, "info");
    const modUrl = moduleVersionUrl(opts.goproxy, opts.importPath, opts.version, "mod");

    const infoRes = await fetchWithRetry(infoUrl, opts);
    const body = await infoRes.text();

    try {
        await fetchWithRetry(modUrl, opts);
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        core.warning(`Module .mod warm failed after successful .info: ${message}`);
    }

    return { infoUrl, status: infoRes.status, body };
}

export async function pullViaGoproxyList(
    tokens: ProxyToken[],
    opts: Omit<PullViaHttpOptions, "goproxy">,
): Promise<HttpPullResult> {
    const urls = httpProxyUrls(tokens);
    if (urls.length === 0) {
        throw new Error(
            "method=http requires an HTTP(S) GOPROXY entry; got only direct/off. Use method: go-get.",
        );
    }

    let lastError: Error | undefined;
    for (const goproxy of urls) {
        try {
            return await pullViaHttp({ ...opts, goproxy });
        } catch (err) {
            lastError = err instanceof Error ? err : new Error(String(err));
            if (lastError instanceof HttpStatusError && (lastError.status === 404 || lastError.status === 410)) {
                continue;
            }
            throw lastError;
        }
    }

    throw lastError ?? new Error("All GOPROXY URLs failed");
}
