import * as core from "@actions/core";
import { moduleVersionUrl, sanitizeProxy } from "./goproxy.js";

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

const RETRYABLE = new Set([404, 410, 429, 500, 502, 503, 504]);
const DEFAULT_DELAYS = [2000, 5000, 10000, 20000, 20000];

async function fetchWithRetry(url: string, opts: PullViaHttpOptions): Promise<Response> {
    const fetchImpl = opts.fetchImpl ?? fetch;
    const sleep = opts.sleep ?? ((ms) => new Promise((r) => setTimeout(r, ms)));
    const retries = opts.retries ?? 5;
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            core.info(`GET ${sanitizeProxy(url)} (attempt ${attempt + 1}/${retries})`);
            const res = await fetchImpl(url, {
                signal: AbortSignal.timeout(opts.timeoutMs ?? 30_000),
            });
            if (res.ok) {
                return res;
            }
            lastError = new Error(`GET ${sanitizeProxy(url)} failed with HTTP ${res.status}`);
            if (!RETRYABLE.has(res.status) || attempt === retries - 1) {
                throw lastError;
            }
        } catch (err) {
            lastError = err instanceof Error ? err : new Error(String(err));
            if (attempt === retries - 1) {
                throw lastError;
            }
            const statusMatch = /HTTP (\d+)/.exec(lastError.message);
            const status = statusMatch ? Number(statusMatch[1]) : undefined;
            if (status !== undefined && !RETRYABLE.has(status)) {
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

    await fetchWithRetry(modUrl, opts);

    return { infoUrl, status: infoRes.status, body };
}
