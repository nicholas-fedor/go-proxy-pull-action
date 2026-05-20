import { describe, expect, it } from "bun:test";
import { sanitizeProxy } from "./main.js";

describe("sanitizeProxy", () => {
    it("returns plain URL unchanged", () => {
        expect(sanitizeProxy("https://proxy.golang.org")).toBe("https://proxy.golang.org");
    });

    it("redacts username and password", () => {
        const result = sanitizeProxy("https://user:pass@proxy.example.com");
        expect(result).toBe("https://***:***@proxy.example.com/");
    });

    it("redacts username only", () => {
        const result = sanitizeProxy("https://user@proxy.example.com");
        expect(result).toBe("https://***:***@proxy.example.com/");
    });

    it("redacts token as password", () => {
        const result = sanitizeProxy("https://user:token123@proxy.example.com");
        expect(result).toBe("https://***:***@proxy.example.com/");
    });

    it("returns invalid URL strings as-is", () => {
        expect(sanitizeProxy("not-a-url")).toBe("not-a-url");
    });

    it("preserves path, port, and query when redacting", () => {
        const result = sanitizeProxy("https://user:pass@proxy.example.com:8080/path?q=1");
        expect(result).toBe("https://***:***@proxy.example.com:8080/path?q=1");
    });
});
