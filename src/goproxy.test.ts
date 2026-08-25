import { describe, expect, it } from "bun:test";
import { parseGoproxy, firstHttpProxy, encodeModulePath, moduleVersionUrl } from "./goproxy.js";

describe("parseGoproxy", () => {
    it("parses a single https URL and normalizes trailing slash away for joining", () => {
        const tokens = parseGoproxy("https://proxy.golang.org");
        expect(tokens).toEqual([{ kind: "url", href: "https://proxy.golang.org" }]);
    });

    it("parses comma-separated list with direct fallback", () => {
        const tokens = parseGoproxy("https://proxy.golang.org,direct");
        expect(tokens).toEqual([
            { kind: "url", href: "https://proxy.golang.org" },
            { kind: "direct" },
        ]);
    });

    it("accepts off and direct as sole values", () => {
        expect(parseGoproxy("off")).toEqual([{ kind: "off" }]);
        expect(parseGoproxy("direct")).toEqual([{ kind: "direct" }]);
    });

    it("trims whitespace around tokens", () => {
        const tokens = parseGoproxy(" https://proxy.example.com , direct ");
        expect(tokens[0]).toEqual({ kind: "url", href: "https://proxy.example.com" });
        expect(tokens[1]).toEqual({ kind: "direct" });
    });

    it("throws on empty string", () => {
        expect(() => parseGoproxy("")).toThrow(/goproxy/i);
    });

    it("throws on unsupported URL protocol", () => {
        expect(() => parseGoproxy("ftp://proxy.example.com")).toThrow(/protocol/i);
    });

    it("throws on a non-URL token that is not off or direct", () => {
        expect(() => parseGoproxy("not-a-url")).toThrow(/goproxy/i);
    });

    it("keeps userinfo in the href (needed for authenticated private proxies)", () => {
        const tokens = parseGoproxy("https://user:token@proxy.example.com");
        expect(tokens[0]).toEqual({ kind: "url", href: "https://user:token@proxy.example.com" });
    });
});

describe("firstHttpProxy", () => {
    it("returns the first url token", () => {
        expect(firstHttpProxy(parseGoproxy("https://proxy.golang.org,direct"))).toBe(
            "https://proxy.golang.org",
        );
    });

    it("returns null when only direct/off", () => {
        expect(firstHttpProxy(parseGoproxy("direct"))).toBeNull();
        expect(firstHttpProxy(parseGoproxy("off"))).toBeNull();
    });
});

describe("encodeModulePath", () => {
    it("leaves already-lowercase paths unchanged", () => {
        expect(encodeModulePath("github.com/example/mod")).toBe("github.com/example/mod");
    });

    it("encodes uppercase letters with bang prefix", () => {
        expect(encodeModulePath("github.com/Example/Mod")).toBe("github.com/!example/!mod");
    });
});

describe("moduleVersionUrl", () => {
    it("builds an .info URL", () => {
        expect(
            moduleVersionUrl(
                "https://proxy.golang.org",
                "github.com/foo/bar",
                "v1.2.3",
                "info",
            ),
        ).toBe("https://proxy.golang.org/github.com/foo/bar/@v/v1.2.3.info");
    });

    it("encodes mixed-case import paths in the URL", () => {
        expect(
            moduleVersionUrl("https://proxy.golang.org", "github.com/Foo/Bar", "v1.0.0", "info"),
        ).toBe("https://proxy.golang.org/github.com/!foo/!bar/@v/v1.0.0.info");
    });

    it("does not produce a double slash when goproxy already has a trailing slash", () => {
        expect(
            moduleVersionUrl("https://proxy.golang.org/", "github.com/foo/bar", "v1.0.0", "mod"),
        ).toBe("https://proxy.golang.org/github.com/foo/bar/@v/v1.0.0.mod");
    });
});
