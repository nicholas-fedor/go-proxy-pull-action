import { describe, expect, it } from "bun:test";
import { parseVersion, parseExplicitVersion } from "./version.js";

describe("parseVersion", () => {
    describe("standard version tags", () => {
        it("parses a simple v1.0.0 tag", () => {
            const result = parseVersion("refs/tags/v1.0.0");
            expect(result).toEqual({
                tag: "v1.0.0",
                version: "v1.0.0",
                isSubmodule: false,
                submodulePath: "",
                majorVersion: 1,
            });
        });

        it("parses a v2.1.3 tag", () => {
            const result = parseVersion("refs/tags/v2.1.3");
            expect(result).toEqual({
                tag: "v2.1.3",
                version: "v2.1.3",
                isSubmodule: false,
                submodulePath: "",
                majorVersion: 2,
            });
        });

        it("parses a v0.0.1 tag", () => {
            const result = parseVersion("refs/tags/v0.0.1");
            expect(result).toEqual({
                tag: "v0.0.1",
                version: "v0.0.1",
                isSubmodule: false,
                submodulePath: "",
                majorVersion: 0,
            });
        });

        it("parses a pre-release tag", () => {
            const result = parseVersion("refs/tags/v1.0.0-beta.1");
            expect(result).toEqual({
                tag: "v1.0.0-beta.1",
                version: "v1.0.0-beta.1",
                isSubmodule: false,
                submodulePath: "",
                majorVersion: 1,
            });
        });

        it("parses a tag without v prefix", () => {
            const result = parseVersion("refs/tags/3.2.1");
            expect(result).toEqual({
                tag: "3.2.1",
                version: "3.2.1",
                isSubmodule: false,
                submodulePath: "",
                majorVersion: 3,
            });
        });

        it("parses a high major version", () => {
            const result = parseVersion("refs/tags/v10.0.0");
            expect(result.majorVersion).toBe(10);
        });
    });

    describe("submodule version tags", () => {
        it("parses a single-level submodule tag", () => {
            const result = parseVersion("refs/tags/contrib/v1.2.3");
            expect(result).toEqual({
                tag: "contrib/v1.2.3",
                version: "v1.2.3",
                isSubmodule: true,
                submodulePath: "contrib",
                majorVersion: 1,
            });
        });

        it("parses a multi-level submodule tag", () => {
            const result = parseVersion("refs/tags/internal/utils/v0.5.0");
            expect(result).toEqual({
                tag: "internal/utils/v0.5.0",
                version: "v0.5.0",
                isSubmodule: true,
                submodulePath: "internal/utils",
                majorVersion: 0,
            });
        });

        it("parses a submodule tag with hyphenated path", () => {
            const result = parseVersion("refs/tags/my-submodule/v2.0.0");
            expect(result).toEqual({
                tag: "my-submodule/v2.0.0",
                version: "v2.0.0",
                isSubmodule: true,
                submodulePath: "my-submodule",
                majorVersion: 2,
            });
        });
    });

    describe("non-tag refs", () => {
        it("throws on a branch ref", () => {
            expect(() => parseVersion("refs/heads/master")).toThrow(/not a tag/i);
        });

        it("throws on a pull-request ref", () => {
            expect(() => parseVersion("refs/pull/12/merge")).toThrow(/not a tag/i);
        });
    });

    describe("parseExplicitVersion", () => {
        it("parses v1.2.3", () => {
            const result = parseExplicitVersion("v1.2.3");
            expect(result.version).toBe("v1.2.3");
            expect(result.isSubmodule).toBe(false);
            expect(result.majorVersion).toBe(1);
        });

        it("parses submodule/v2.0.0", () => {
            const result = parseExplicitVersion("contrib/v2.0.0");
            expect(result.version).toBe("v2.0.0");
            expect(result.isSubmodule).toBe(true);
            expect(result.submodulePath).toBe("contrib");
            expect(result.majorVersion).toBe(2);
        });

        it("throws on master", () => {
            expect(() => parseExplicitVersion("master")).toThrow(/module version/i);
        });
    });

    describe("edge cases", () => {
        it("throws on a non-numeric version", () => {
            expect(() => parseVersion("refs/tags/vabc.0.0")).toThrow(/module version/i);
        });

        it("throws on an empty version string", () => {
            expect(() => parseVersion("refs/tags/")).toThrow(/module version/i);
        });

        it("throws on a tag with only a major version", () => {
            expect(() => parseVersion("refs/tags/v3")).toThrow(/module version/i);
        });

        it("handles tag with leading zeros in major version", () => {
            const result = parseVersion("refs/tags/v02.0.0");
            expect(result.majorVersion).toBe(2);
        });

        it("throws on just a 'v' prefix with no number", () => {
            expect(() => parseVersion("refs/tags/v")).toThrow(/module version/i);
        });

        it("throws on a negative major version", () => {
            expect(() => parseVersion("refs/tags/v-1.0.0")).toThrow(/module version/i);
        });
    });
});
