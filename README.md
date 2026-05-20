# Go Proxy Cache Updater Action

Automatically pull new Go module releases to your specified proxy cache when tags are created.
This ensures your module is immediately available and documentation is updated on platforms like pkg.go.dev.

## Features

- Automatically triggers on new tag releases that match semantic version patterns
- Supports standard version tags (`vX.Y.Z`) and submodule version tags (`submodule/path/vX.Y.Z`)
- Customizable proxy configuration
- Custom import path support
- Configurable Go version via setup-go
- Simple to configure workflow

## Usage

### Basic Configuration

Create a new workflow file (e.g., `.github/workflows/go-proxy-pull.yml`) with the following content:

```yaml
name: Go Proxy Cache Updater
on:
  release:
    types:
      - created

jobs:
  update-proxy-cache:
    name: Update Go Proxy Cache
    runs-on: ubuntu-latest
    steps:
      - name: Pull new module version
        uses: nicholas-fedor/go-proxy-pull-action@v1
```

This workflow will trigger whenever a new release is published with a tag matching `vX.Y.Z` or `submodule/path/vX.Y.Z` format.

## Inputs

### `goproxy`

URL of the Go proxy to use for pulling the new module version.
Use this to specify a self-hosted proxy or alternative public proxy.

- **Type**: string
- **Required**: false
- **Default**: `https://proxy.golang.org`

#### Example: Custom Proxy

```yaml
- name: Pull new module version
  uses: nicholas-fedor/go-proxy-pull-action@v1
  with:
    goproxy: https://gocenter.io
```

### `import_path`

Custom import path for your module.
Use this if your module uses a custom domain instead of the GitHub repository URL.

- **Type**: string
- **Required**: false
- **Default**: `github.com/<user>/<repo>`

#### Example: Custom Import Path

```yaml
- name: Pull new module version
  uses: nicholas-fedor/go-proxy-pull-action@v1
  with:
    import_path: example.com/myproject
```

### `go-version`

The Go version to use. Supports exact versions (`1.26.1`), minor version shorthand (`1.26`), semver ranges, aliases (`stable`, `oldstable`), and wildcards. Takes precedence over `go-version-file`.

- **Type**: string
- **Required**: false
- **Default**: `1.26`

### `go-version-file`

Path to a file containing the Go version. Supports `go.mod`, `go.work`, `.go-version`, and `.tool-versions` files. Ignored if `go-version` is also set.

- **Type**: string
- **Required**: false
- **Default**: *(empty)*

### `check-latest`

Set to `true` to always check for the latest available version that satisfies the version spec.

- **Type**: boolean
- **Required**: false
- **Default**: `false`

### `cache`

Enable caching of Go modules and build outputs.

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

GitHub token for downloading Go distributions. Useful for GHES rate limiting scenarios.

- **Type**: string
- **Required**: false
- **Default**: *(empty)*

### `go-download-base-url`

Custom base URL for downloading Go distributions. Use this for mirrors or air-gapped environments.

- **Type**: string
- **Required**: false
- **Default**: *(empty)*

## Supported Tag Formats

The action supports the following tag formats:

### Standard Version Tags

- `v1.0.0`
- `v2.1.3`
- `v1.0.0-beta.1` (pre-release versions)

### Submodule Version Tags

- `contrib/awesomity/v1.2.3`
- `internal/utils/v0.5.0`

## How It Works

1. The action triggers on new release creation
2. Sets up the Go toolchain using [actions/setup-go](https://github.com/actions/setup-go) with the specified version
3. Validates inputs (proxy URL, import path)
4. Extracts the version from the tag
5. Determines the module import path (using default or custom value)
6. Handles submodule paths from tags like `submodule/path/vX.Y.Z`
7. Adds major version suffix for modules with major version > 1 (e.g., `/v2`)
8. Uses `go get` to pull the new version to the configured proxy
9. Updates the proxy cache with the new module version

## Architecture

This action is built with TypeScript and compiled to a single `dist/index.js` bundle using [Bun](https://bun.sh). It uses a composite action structure:

- **Go setup** — [actions/setup-go](https://github.com/actions/setup-go) provides the Go toolchain
- **TypeScript runtime** — the bundled JS runs via `node24` shell
- **@actions/core** — input parsing, logging, and error reporting
- **@actions/exec** — running `go mod init` and `go get` commands
- **@actions/io** — temporary directory cleanup

Source code in `src/` is modular:

- `inputs.ts` — input parsing and validation
- `version.ts` — tag/version extraction
- `package.ts` — package path resolution
- `proxy.ts` — `go get` execution
- `main.ts` — orchestration

## Why Use This Action?

While Go proxies typically pull modules on-demand, there are scenarios where proactive caching is beneficial:

- **Documentation Updates**: Ensures pkg.go.dev documentation is immediately available for new releases
- **Reliability**: Prevents proxy timeouts or failures when modules are first requested
- **Performance**: Reduces latency for initial module downloads
- **Availability**: Ensures your module is accessible from your proxy even if GitHub is experiencing issues

## Configuration Example

### Full Configuration with Custom Proxy and Import Path

```yaml
name: Go Proxy Cache Updater
on:
  release:
    types:
      - created

jobs:
  update-proxy-cache:
    name: Update Go Proxy Cache
    runs-on: ubuntu-latest
    steps:
      - name: Pull new module version
        uses: nicholas-fedor/go-proxy-pull-action@v1
        with:
          goproxy: https://proxy.example.com
          import_path: example.com/myproject
          go-version: '1.26'
```

## License

This project is released under the [MIT License](LICENSE).

## Contributing

Contributions are welcome!
Please feel free to submit a pull request.
