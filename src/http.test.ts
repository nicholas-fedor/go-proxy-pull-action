import { describe, expect, it, mock } from "bun:test";
import { pullViaHttp } from "./http.js";

function jsonResponse(status: number, body = "{}"): Response {
    return new Response(body, { status, headers: { "Content-Type": "application/json" } });
}

describe("pullViaHttp", () => {
    it("succeeds when .info and .mod both return 200", async () => {
        const calls: string[] = [];
        const fetchImpl = mock(async (input: RequestInfo | URL) => {
            const url = String(input);
            calls.push(url);
            if (url.endsWith(".info")) return jsonResponse(200, `{"Version":"v1.2.3"}`);
            if (url.endsWith(".mod")) return new Response("module github.com/example/mod\n", { status: 200 });
            return jsonResponse(404);
        });

        const result = await pullViaHttp({
            goproxy: "https://proxy.golang.org",
            importPath: "github.com/example/mod",
            version: "v1.2.3",
            fetchImpl: fetchImpl as unknown as typeof fetch,
            sleep: async () => {},
        });

        expect(result.status).toBe(200);
        expect(result.infoUrl).toBe(
            "https://proxy.golang.org/github.com/example/mod/@v/v1.2.3.info",
        );
        expect(calls).toEqual([
            "https://proxy.golang.org/github.com/example/mod/@v/v1.2.3.info",
            "https://proxy.golang.org/github.com/example/mod/@v/v1.2.3.mod",
        ]);
    });

    it("retries .info 404s then succeeds", async () => {
        let infoAttempts = 0;
        const sleeps: number[] = [];
        const fetchImpl = mock(async (input: RequestInfo | URL) => {
            const url = String(input);
            if (url.endsWith(".info")) {
                infoAttempts++;
                if (infoAttempts < 3) return jsonResponse(404);
                return jsonResponse(200, `{"Version":"v1.2.3"}`);
            }
            return new Response("module github.com/example/mod\n", { status: 200 });
        });

        await pullViaHttp({
            goproxy: "https://proxy.golang.org",
            importPath: "github.com/example/mod",
            version: "v1.2.3",
            retries: 5,
            fetchImpl: fetchImpl as unknown as typeof fetch,
            sleep: async (ms) => {
                sleeps.push(ms);
            },
        });

        expect(infoAttempts).toBe(3);
        expect(sleeps).toEqual([2000, 5000]);
    });

    it("gives up after exhausting retries on 404", async () => {
        const fetchImpl = mock(async () => jsonResponse(404));

        await expect(
            pullViaHttp({
                goproxy: "https://proxy.golang.org",
                importPath: "github.com/example/mod",
                version: "v1.2.3",
                retries: 5,
                fetchImpl: fetchImpl as unknown as typeof fetch,
                sleep: async () => {},
            }),
        ).rejects.toThrow(/HTTP 404/);

        expect(fetchImpl).toHaveBeenCalledTimes(5);
    });

    it("does not retry HTTP 403", async () => {
        const fetchImpl = mock(async () => jsonResponse(403));

        await expect(
            pullViaHttp({
                goproxy: "https://proxy.golang.org",
                importPath: "github.com/example/mod",
                version: "v1.2.3",
                retries: 5,
                fetchImpl: fetchImpl as unknown as typeof fetch,
                sleep: async () => {},
            }),
        ).rejects.toThrow(/HTTP 403/);

        expect(fetchImpl).toHaveBeenCalledTimes(1);
    });

    it("retries a network error then succeeds", async () => {
        let infoAttempts = 0;
        const fetchImpl = mock(async (input: RequestInfo | URL) => {
            const url = String(input);
            if (url.endsWith(".info")) {
                infoAttempts++;
                if (infoAttempts === 1) throw new Error("network down");
                return jsonResponse(200, `{"Version":"v1.2.3"}`);
            }
            return new Response("module github.com/example/mod\n", { status: 200 });
        });

        const result = await pullViaHttp({
            goproxy: "https://proxy.golang.org",
            importPath: "github.com/example/mod",
            version: "v1.2.3",
            fetchImpl: fetchImpl as unknown as typeof fetch,
            sleep: async () => {},
        });

        expect(result.status).toBe(200);
        expect(infoAttempts).toBe(2);
    });

    it("encodes mixed-case import paths in the request URL", async () => {
        const calls: string[] = [];
        const fetchImpl = mock(async (input: RequestInfo | URL) => {
            const url = String(input);
            calls.push(url);
            if (url.endsWith(".info")) return jsonResponse(200, "{}");
            return new Response("module github.com/Example/Mod\n", { status: 200 });
        });

        await pullViaHttp({
            goproxy: "https://proxy.golang.org",
            importPath: "github.com/Example/Mod",
            version: "v1.0.0",
            fetchImpl: fetchImpl as unknown as typeof fetch,
            sleep: async () => {},
        });

        expect(calls[0]).toBe("https://proxy.golang.org/github.com/!example/!mod/@v/v1.0.0.info");
    });

    it("succeeds when the module go directive is newer than a typical client toolchain", async () => {
        const fetchImpl = mock(async (input: RequestInfo | URL) => {
            const url = String(input);
            if (url.endsWith(".info")) {
                return jsonResponse(200, `{"Version":"v1.2.3"}`);
            }
            return new Response("module github.com/example/mod\ngo 1.27.0\n", { status: 200 });
        });

        const result = await pullViaHttp({
            goproxy: "https://proxy.golang.org",
            importPath: "github.com/example/mod",
            version: "v1.2.3",
            fetchImpl: fetchImpl as unknown as typeof fetch,
            sleep: async () => {},
        });

        expect(result.status).toBe(200);
        expect(result.infoUrl).toBe(
            "https://proxy.golang.org/github.com/example/mod/@v/v1.2.3.info",
        );
    });

    it("redacts credentials in the thrown error URL", async () => {
        const fetchImpl = mock(async () => jsonResponse(403));

        await expect(
            pullViaHttp({
                goproxy: "https://user:token@proxy.example.com",
                importPath: "github.com/example/mod",
                version: "v1.2.3",
                fetchImpl: fetchImpl as unknown as typeof fetch,
                sleep: async () => {},
            }),
        ).rejects.toThrow(/https:\/\/\*\*\*:\*\*\*@proxy\.example\.com/);
    });
});
