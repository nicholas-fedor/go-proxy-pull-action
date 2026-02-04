#!/bin/sh

readonly TAG="${GITHUB_REF#refs/tags/*}"
readonly VERSION="${TAG##*/}"

PACKAGE=${INPUT_IMPORT_PATH:=github.com/${GITHUB_REPOSITORY}}

# Submodules version tags are formatted as <submodule>/vX.Y.Z,
# so we extract the submodule name and append it to the main module
# import path
if [ "$VERSION" != "$TAG" ]; then
  PACKAGE=${PACKAGE}/${TAG%"/$VERSION"}
fi

# If either check fails, the version scoping logic (adding /vX to the package path)
# is skipped, preventing the arithmetic error
MAJOR_VERSION="$(printf '%s' "$VERSION" | cut -d '.' -f 1 | sed 's/v//g')"
readonly MAJOR_VERSION
# [ -n "$MAJOR_VERSION" ] check ensures MAJOR_VERSION is not empty
# grep -q '^[0-9]\+$' check ensures MAJOR_VERSION is numeric (contains only digits)
if [ -n "$MAJOR_VERSION" ] && echo "$MAJOR_VERSION" | grep -q '^[0-9]\+$'; then
  # Remove leading zeros to avoid octal interpretation in POSIX sh arithmetic
  DECIMAL_VERSION="$(printf '%s' "$MAJOR_VERSION" | sed 's/^0*//')"
  # Handle case where MAJOR_VERSION was all zeros
  [ -z "$DECIMAL_VERSION" ] && DECIMAL_VERSION="0"
  
  if [ "$DECIMAL_VERSION" -gt 1 ]; then
    PACKAGE="$PACKAGE/v$MAJOR_VERSION"
  fi
fi

export GO111MODULE=on
export GOPROXY="$INPUT_GOPROXY"

mkdir dummy
cd dummy || exit
go mod init dummy
go get "$PACKAGE@$VERSION"
