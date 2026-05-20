import { describe, expect, it, mock, spyOn, afterEach } from "bun:test";
import { parseInputs } from "./inputs.js";

afterEach(() => {
    mock.restore();
});

async function mockGetInput(values: Record<string, string>) {
    const core = await import("@actions/core");
    spyOn(core, "getInput").mockImplementation((name: string) => {
        const value = values[name] ?? "";
        return value.trim();
    });
}

describe("parseInputs", () => {
    describe("goproxy", () => {
        it("uses default proxy when not provided", async () => {
            await mockGetInput({});
            const result = parseInputs();
            expect(result.goproxy).toBe("https://proxy.golang.org/");
        });

        it("accepts a custom http proxy URL", async () => {
            await mockGetInput({ goproxy: "http://proxy.example.com" });
            const result = parseInputs();
            expect(result.goproxy).toBe("http://proxy.example.com/");
        });

        it("accepts a custom https proxy URL", async () => {
            await mockGetInput({ goproxy: "https://proxy.example.com" });
            const result = parseInputs();
            expect(result.goproxy).toBe("https://proxy.example.com/");
        });

        it("throws on invalid URL", async () => {
            await mockGetInput({ goproxy: "not-a-url" });
            expect(() => parseInputs()).toThrow("Invalid goproxy URL");
        });

        it("throws on unsupported protocol", async () => {
            await mockGetInput({ goproxy: "ftp://proxy.example.com" });
            expect(() => parseInputs()).toThrow("Unsupported protocol");
        });

        it("trims whitespace from input", async () => {
            await mockGetInput({ goproxy: "  https://proxy.example.com  " });
            const result = parseInputs();
            expect(result.goproxy).toBe("https://proxy.example.com/");
        });
    });

    describe("import_path", () => {
        it("uses empty string when not provided", async () => {
            await mockGetInput({});
            const result = parseInputs();
            expect(result.importPath).toBe("");
        });

        it("accepts a valid import path", async () => {
            await mockGetInput({ import_path: "example.com/myproject" });
            const result = parseInputs();
            expect(result.importPath).toBe("example.com/myproject");
        });

        it("throws on import path with whitespace", async () => {
            await mockGetInput({ import_path: "example.com/my project" });
            expect(() => parseInputs()).toThrow("contains whitespace");
        });

        it("throws on import path with protocol scheme", async () => {
            await mockGetInput({ import_path: "https://example.com/myproject" });
            expect(() => parseInputs()).toThrow("should not include a protocol scheme");
        });

        it("trims whitespace from input", async () => {
            await mockGetInput({ import_path: "  example.com/myproject  " });
            const result = parseInputs();
            expect(result.importPath).toBe("example.com/myproject");
        });
    });

    describe("combined inputs", () => {
        it("parses both inputs correctly", async () => {
            await mockGetInput({
                goproxy: "https://private.proxy.io",
                import_path: "my.domain.com/lib",
            });
            const result = parseInputs();
            expect(result.goproxy).toBe("https://private.proxy.io/");
            expect(result.importPath).toBe("my.domain.com/lib");
        });
    });
});
