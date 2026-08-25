# Go Proxy Cache Updater Action

Warm a Go module proxy (and optionally pkg.go.dev) when a module version is tagged.
By default this uses the module proxy HTTP protocol (`.info` then `.mod`) so it does not depend on the client Go version.

## Features

- Default HTTP warming — no Go toolchain install required
- Optional `go get` path for proxies that need the Go toolchain
- Standard version tags (`vX.Y.Z`) and submodule tags (`submodule/path/vX.Y.Z`)
- Explicit `version` input for `workflow_dispatch` / `workflow_call`
- GOPROXY lists (`https://proxy.golang.org,direct`)
- Retries on proxy 404/410/429/5xx and network errors
- Custom import paths; default `github.com/<owner>/<repo>` is lowercased

## Usage

### Tag push

```yaml
name: Go Proxy Cache Updater
on:
  push:
    tags:
      - "v*.*.*"

jobs:
  update-proxy-cache:
    name: Update Go Proxy Cache
    runs-on: ubuntu-latest
    steps:
      - name: Pull new module version
        uses: nicholas-fedor/go-proxy-pull-action@v1
```

### Reusable workflow / workflow_call

Pass `version` from the caller. `workflow_dispatch` on a branch also requires `version` — the action refuses non-tag `GITHUB_REF` values.

```yaml
jobs:
  update-proxy-cache:
    runs-on: ubuntu-latest
    steps:
      - name: Pull new module version
        uses: nicholas-fedor/go-proxy-pull-action@v1
        with:
          version: ${{ github.ref_name }}
```

## Inputs

### `goproxy`

Go proxy list, same syntax as the `GOPROXY` environment variable: comma-separated HTTP(S) URLs plus optional `direct` or `off`.

- **Type**: string
- **Required**: false
- **Default**: `https://proxy.golang.org`

```yaml
with:
  goproxy: https://proxy.golang.org,direct
```

The default `http` method uses the first HTTP(S) entry. If the list is only `direct` or `off`, set `method: go-get`.

### `import_path`

Custom import path. Use this for vanity domains. When unset, the action uses `github.com/<owner>/<repo>` with the GitHub repository name lowercased. A custom `import_path` is not rewritten.

- **Type**: string
- **Required**: false
- **Default**: `github.com/<user>/<repo>` (lowercased)

```yaml
with:
  import_path: example.com/myproject
```

### `version`

Module version to pull (`v1.2.3` or `submodule/v1.2.3`). If unset, `GITHUB_REF` must be `refs/tags/...`.

- **Type**: string
- **Required**: false
- **Default**: *(empty — use the tag from `GITHUB_REF`)*

### `method`

- `http` (default): GET `{goproxy}/{module}/@v/{version}.info` then `.mod`. Does not install Go.
- `go-get`: dummy module + `go get`, with `GOTOOLCHAIN=auto`. Installs Go via setup-go.

- **Type**: string
- **Required**: false
- **Default**: `http`

### `retries`

Max HTTP attempts for `.info` / `.mod` (`http` method only). Retries 404, 410, 429, 5xx, and network errors. Does not retry 400/401/403.

- **Type**: number
- **Required**: false
- **Default**: `5`

### `pkg-go-dev`

If `true`, GET `https://pkg.go.dev/{import}@{version}` after a successful proxy warm. Failures are warnings and do not fail the action.

- **Type**: boolean
- **Required**: false
- **Default**: `true`

### `go-version`

Go version for `method: go-get` only. Supports exact versions, minor shorthand, semver ranges, aliases (`stable`, `oldstable`), and wildcards. Takes precedence over `go-version-file`.

- **Type**: string
- **Required**: false
- **Default**: `stable`

`stable` is a [setup-go alias](https://github.com/actions/setup-go/blob/main/docs/advanced-usage.md) for the latest stable release in the go-versions manifest. Aliases are **not** supported when `go-download-base-url` is set — pass an exact version in that case.

### `go-version-file`

Path to a `go.mod`, `go.work`, `.go-version`, or `.tool-versions` file. Relative to the repository root. Ignored if `go-version` is also set. Only used when `method: go-get`. Requires a checkout of that file.

- **Type**: string
- **Required**: false
- **Default**: *(empty)*

### `check-latest`

Set to `true` to always check for the latest available version that satisfies the version spec (`method: go-get` only).

- **Type**: boolean
- **Required**: false
- **Default**: `false`

### `cache`

Enable caching of Go modules and build outputs (`method: go-get` only).

- **Type**: boolean
- **Required**: false
- **Default**: `false`

### `cache-dependency-path`

Path to dependency files for caching (e.g., `go.sum`). Supports glob patterns. Only used when `cache` is `true`.

- **Type**: string
- **Required**: false
- **Default**: *(empty)*

### `architecture`

Target architecture for Go (e.g., `x86`, `x64`). Uses system architecture by default.

- **Type**: string
- **Required**: false
- **Default**: *(empty — auto-detected)*

### `token`

GitHub token for downloading Go distributions. Useful for GHES rate limiting. Defaults to `github.token` when unset.

- **Type**: string
- **Required**: false
- **Default**: *(empty — uses `github.token`)*

### `go-download-base-url`

Custom base URL for downloading Go distributions (mirrors or air-gapped environments). Not compatible with `stable` / `oldstable`.

- **Type**: string
- **Required**: false
- **Default**: *(empty)*

## Outputs

| Name          | Description                                                |
|---------------|------------------------------------------------------------|
| `import-path` | Resolved module import path                                |
| `version`     | Resolved module version                                    |
| `info-url`    | Module proxy `.info` URL that returned 200 (`http` method) |

## Supported Tag Formats

### Standard Version Tags

- `v1.0.0`
- `v2.1.3`
- `v1.0.0-beta.1` (pre-release versions)

### Submodule Version Tags

- `contrib/awesomity/v1.2.3`
- `internal/utils/v0.5.0`

## How It Works

1. Resolves the version from `version` or from a `refs/tags/...` `GITHUB_REF`
2. Resolves the import path (custom, or lowercased `github.com/<owner>/<repo>`), including submodule paths and `/vN` for major > 1
3. Default `http` method: GET `.info` and `.mod` on the first HTTP(S) GOPROXY entry, with retries
4. Optional `go-get` method: setup-go, dummy module, `go get` with `GOTOOLCHAIN=auto`
5. Optionally pings pkg.go.dev (warnings only)
6. Sets outputs and a success notice

HTTP warming does not install Go. A module whose `go` directive is newer than any local toolchain still registers on the proxy.

## Architecture

This action is built with TypeScript and compiled to a single `dist/index.js` bundle using [Bun](https://bun.sh). It is a composite action:

- **HTTP warming** — native `fetch` against the module proxy protocol
- **Go setup** — [actions/setup-go](https://github.com/actions/setup-go) only when `method: go-get`
- **TypeScript runtime** — the bundled JS runs with `node` under `shell: bash`
- **@actions/core** — input parsing, logging, outputs, and error reporting
- **@actions/exec** / **@actions/io** — `go get` path only

Source code in `src/`:

- `inputs.ts` — input parsing and validation
- `goproxy.ts` — GOPROXY lists, module path encoding, URL sanitization
- `version.ts` — tag/version extraction
- `package.ts` — package path resolution
- `http.ts` — HTTP warming with retries
- `proxy.ts` — `go get` execution
- `main.ts` — orchestration

## Why Use This Action?

Go proxies typically pull modules on demand. Proactive warming helps when:

- pkg.go.dev documentation should appear promptly after a release
- The first consumer request should not wait for the proxy to clone the module
- GitHub is slow or unreachable for later fetches (the proxy already has the bits)

## Full Configuration Example

```yaml
name: Go Proxy Cache Updater
on:
  push:
    tags:
      - "v*.*.*"

jobs:
  update-proxy-cache:
    name: Update Go Proxy Cache
    runs-on: ubuntu-latest
    steps:
      - name: Pull new module version
        uses: nicholas-fedor/go-proxy-pull-action@v1
        with:
          goproxy: https://proxy.example.com,direct
          import_path: example.com/myproject
          version: ${{ github.ref_name }}
          method: http
          retries: 5
          pkg-go-dev: true
```

## License

This project is released under the [MIT License](LICENSE).

## Contributing

Contributions are welcome!
Please feel free to submit a pull request.
