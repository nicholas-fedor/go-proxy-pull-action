import { describe, expect, it } from "bun:test";
import { resolvePackage } from "./package.js";
import type { VersionInfo } from "./version.js";

describe("resolvePackage", () => {
    describe("standard version tags", () => {
        it("resolves with default import path for v1", () => {
            const versionInfo: VersionInfo = {
                tag: "v1.0.0",
                version: "v1.0.0",
                isSubmodule: false,
                submodulePath: "",
                majorVersion: 1,
            };
            const result = resolvePackage(versionInfo, "", "user/repo");
            expect(result.importPath).toBe("github.com/user/repo");
            expect(result.version).toBe("v1.0.0");
        });

        it("resolves with default import path for v0", () => {
            const versionInfo: VersionInfo = {
                tag: "v0.5.0",
                version: "v0.5.0",
                isSubmodule: false,
                submodulePath: "",
                majorVersion: 0,
            };
            const result = resolvePackage(versionInfo, "", "user/repo");
            expect(result.importPath).toBe("github.com/user/repo");
        });

        it("appends /v2 suffix for major version 2", () => {
            const versionInfo: VersionInfo = {
                tag: "v2.0.0",
                version: "v2.0.0",
                isSubmodule: false,
                submodulePath: "",
                majorVersion: 2,
            };
            const result = resolvePackage(versionInfo, "", "user/repo");
            expect(result.importPath).toBe("github.com/user/repo/v2");
        });

        it("appends /v3 suffix for major version 3", () => {
            const versionInfo: VersionInfo = {
                tag: "v3.1.0",
                version: "v3.1.0",
                isSubmodule: false,
                submodulePath: "",
                majorVersion: 3,
            };
            const result = resolvePackage(versionInfo, "", "user/repo");
            expect(result.importPath).toBe("github.com/user/repo/v3");
        });

        it("does not duplicate version suffix when import path already ends with /v2", () => {
            const versionInfo: VersionInfo = {
                tag: "v2.0.0",
                version: "v2.0.0",
                isSubmodule: false,
                submodulePath: "",
                majorVersion: 2,
            };
            const result = resolvePackage(versionInfo, "example.com/myproject/v2", "user/repo");
            expect(result.importPath).toBe("example.com/myproject/v2");
        });

        it("does not duplicate version suffix for v3", () => {
            const versionInfo: VersionInfo = {
                tag: "v3.1.0",
                version: "v3.1.0",
                isSubmodule: false,
                submodulePath: "",
                majorVersion: 3,
            };
            const result = resolvePackage(versionInfo, "example.com/lib/v3", "user/repo");
            expect(result.importPath).toBe("example.com/lib/v3");
        });

        it("does not append suffix for major version 1", () => {
            const versionInfo: VersionInfo = {
                tag: "v1.2.3",
                version: "v1.2.3",
                isSubmodule: false,
                submodulePath: "",
                majorVersion: 1,
            };
            const result = resolvePackage(versionInfo, "", "user/repo");
            expect(result.importPath).toBe("github.com/user/repo");
        });
    });

    describe("custom import path", () => {
        it("uses custom import path when provided", () => {
            const versionInfo: VersionInfo = {
                tag: "v1.0.0",
                version: "v1.0.0",
                isSubmodule: false,
                submodulePath: "",
                majorVersion: 1,
            };
            const result = resolvePackage(versionInfo, "example.com/myproject", "user/repo");
            expect(result.importPath).toBe("example.com/myproject");
        });

        it("appends major version suffix to custom import path", () => {
            const versionInfo: VersionInfo = {
                tag: "v2.0.0",
                version: "v2.0.0",
                isSubmodule: false,
                submodulePath: "",
                majorVersion: 2,
            };
            const result = resolvePackage(versionInfo, "example.com/myproject", "user/repo");
            expect(result.importPath).toBe("example.com/myproject/v2");
        });
    });

    describe("submodule version tags", () => {
        it("appends submodule path to import path", () => {
            const versionInfo: VersionInfo = {
                tag: "contrib/v1.2.3",
                version: "v1.2.3",
                isSubmodule: true,
                submodulePath: "contrib",
                majorVersion: 1,
            };
            const result = resolvePackage(versionInfo, "", "user/repo");
            expect(result.importPath).toBe("github.com/user/repo/contrib");
        });

        it("appends multi-level submodule path", () => {
            const versionInfo: VersionInfo = {
                tag: "internal/utils/v0.5.0",
                version: "v0.5.0",
                isSubmodule: true,
                submodulePath: "internal/utils",
                majorVersion: 0,
            };
            const result = resolvePackage(versionInfo, "", "user/repo");
            expect(result.importPath).toBe("github.com/user/repo/internal/utils");
        });

        it("appends submodule path and major version suffix", () => {
            const versionInfo: VersionInfo = {
                tag: "contrib/v2.0.0",
                version: "v2.0.0",
                isSubmodule: true,
                submodulePath: "contrib",
                majorVersion: 2,
            };
            const result = resolvePackage(versionInfo, "", "user/repo");
            expect(result.importPath).toBe("github.com/user/repo/contrib/v2");
        });

        it("appends submodule path with custom import path", () => {
            const versionInfo: VersionInfo = {
                tag: "contrib/v3.0.0",
                version: "v3.0.0",
                isSubmodule: true,
                submodulePath: "contrib",
                majorVersion: 3,
            };
            const result = resolvePackage(versionInfo, "example.com/myproject", "user/repo");
            expect(result.importPath).toBe("example.com/myproject/contrib/v3");
        });
    });

    describe("edge cases", () => {
        it("does not append suffix when majorVersion is null", () => {
            const versionInfo: VersionInfo = {
                tag: "vabc.0.0",
                version: "vabc.0.0",
                isSubmodule: false,
                submodulePath: "",
                majorVersion: null,
            };
            const result = resolvePackage(versionInfo, "", "user/repo");
            expect(result.importPath).toBe("github.com/user/repo");
        });

        it("does not append suffix for major version 0", () => {
            const versionInfo: VersionInfo = {
                tag: "v0.1.0",
                version: "v0.1.0",
                isSubmodule: false,
                submodulePath: "",
                majorVersion: 0,
            };
            const result = resolvePackage(versionInfo, "", "user/repo");
            expect(result.importPath).toBe("github.com/user/repo");
        });
    });
});
