import { describe, expect, it, mock, spyOn, afterEach } from "bun:test";
import { pullToProxy } from "./proxy.js";

afterEach(() => {
    mock.restore();
});

describe("pullToProxy", () => {
    it("creates a temp directory, runs go mod init and go get, then cleans up", async () => {
        const core = await import("@actions/core");
        const exec = await import("@actions/exec");
        const io = await import("@actions/io");
        const fs = await import("node:fs");

        spyOn(core, "info").mockImplementation(() => { });
        spyOn(exec, "exec").mockImplementation(async () => 0);
        spyOn(io, "rmRF").mockImplementation(async () => { });

        const result = await pullToProxy("github.com/user/repo", "v1.0.0", "https://proxy.golang.org");

        expect(result.packagePath).toBe("github.com/user/repo");
        expect(result.version).toBe("v1.0.0");
        expect(result.exitCode).toBe(0);
    });

    it("returns non-zero exit code when go get fails", async () => {
        const core = await import("@actions/core");
        const exec = await import("@actions/exec");
        const io = await import("@actions/io");

        spyOn(core, "info").mockImplementation(() => { });
        let callCount = 0;
        spyOn(exec, "exec").mockImplementation(async () => {
            callCount++;
            return callCount === 1 ? 0 : 1;
        });
        spyOn(io, "rmRF").mockImplementation(async () => { });

        const result = await pullToProxy("github.com/user/repo", "v1.0.0", "https://proxy.golang.org");

        expect(result.exitCode).toBe(1);
    });

    it("cleans up temp directory even on failure", async () => {
        const core = await import("@actions/core");
        const exec = await import("@actions/exec");
        const io = await import("@actions/io");

        spyOn(core, "info").mockImplementation(() => { });
        spyOn(exec, "exec").mockImplementation(async () => {
            throw new Error("go get failed");
        });
        const rmSpy = spyOn(io, "rmRF").mockImplementation(async () => { });

        try {
            await pullToProxy("github.com/user/repo", "v1.0.0", "https://proxy.golang.org");
        } catch {
            // expected
        }

        expect(rmSpy).toHaveBeenCalled();
    });

    it("passes correct environment to go commands", async () => {
        const core = await import("@actions/core");
        const exec = await import("@actions/exec");
        const io = await import("@actions/io");

        spyOn(core, "info").mockImplementation(() => { });
        const execSpy = spyOn(exec, "exec").mockImplementation(async () => 0);
        spyOn(io, "rmRF").mockImplementation(async () => { });

        await pullToProxy("example.com/mod", "v2.0.0", "https://custom.proxy.io");

        // First call: go mod init dummy
        expect(execSpy).toHaveBeenCalledTimes(2);

        // Verify env is passed (second call is go get)
        const secondCall = execSpy.mock.calls[1];
        expect(secondCall).toBeDefined();
        expect(secondCall![2]).toBeDefined();
        expect(secondCall![2]!.env).toMatchObject({
            GO111MODULE: "on",
            GOPROXY: "https://custom.proxy.io",
        });
    });
});
