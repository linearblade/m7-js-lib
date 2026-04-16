#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VERSION_FILE="${ROOT_DIR}/VERSION"
DIST_DIR="${ROOT_DIR}/dist/nomap"
BANNER=$'/**\n * @license\n * Copyright (c) 2026 m7.org\n * SPDX-License-Identifier: LicenseRef-MTL-10\n */'

WITH_MAP=0
VERSION=""

usage() {
    cat <<'EOF'
Usage:
  scripts/build-dist.sh [--version <version>] [--out-dir <dir>] [--with-map]

Options:
  --version <version>  Override VERSION file value.
  --out-dir <dir>      Output directory for the bundles.
  --with-map           Also emit source map output.
  -h, --help           Show this help text.
EOF
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        --version)
            if [[ $# -lt 2 ]]; then
                echo "error: --version requires a value" >&2
                exit 1
            fi
            VERSION="$2"
            shift 2
            ;;
        --out-dir)
            if [[ $# -lt 2 ]]; then
                echo "error: --out-dir requires a value" >&2
                exit 1
            fi
            DIST_DIR="$2"
            shift 2
            ;;
        --with-map)
            WITH_MAP=1
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            echo "error: unknown argument '$1'" >&2
            usage
            exit 1
            ;;
    esac
done

if [[ -z "${VERSION}" ]]; then
    if [[ ! -f "${VERSION_FILE}" ]]; then
        echo "error: VERSION file not found at ${VERSION_FILE}" >&2
        exit 1
    fi
    VERSION="$(tr -d '[:space:]' < "${VERSION_FILE}")"
fi

if [[ -z "${VERSION}" ]]; then
    echo "error: version is empty" >&2
    exit 1
fi

mkdir -p "${DIST_DIR}"

ESBUILD_BIN="npx"
ESBUILD_ARGS=(--yes esbuild@0.27.3)
if command -v esbuild >/dev/null 2>&1; then
    ESBUILD_BIN="esbuild"
    ESBUILD_ARGS=()
fi

build_entry() {
    local entry_file="$1"
    local out_base="$2"
    local label="$3"

    local build_cmd=(
        "${ESBUILD_BIN}"
        "${ESBUILD_ARGS[@]}"
        "${entry_file}"
        --bundle
        --format=esm
        --minify
        --legal-comments=linked
        --banner:js="${BANNER}"
        --outfile="${out_base}"
    )

    if [[ "${WITH_MAP}" -eq 1 ]]; then
        build_cmd+=(--sourcemap)
    fi

    echo "Building ${label}:"
    echo "  version: ${VERSION}"
    echo "  map:     $([[ "${WITH_MAP}" -eq 1 ]] && echo "yes" || echo "no")"
    echo "  output:  ${out_base}"

    "${build_cmd[@]}"

    if [[ "${WITH_MAP}" -eq 0 ]]; then
        rm -f "${out_base}.map"
    fi
}

build_entry "${ROOT_DIR}/src/index.js" "${DIST_DIR}/m7.bundle.v${VERSION}.min.js" "m7-js-lib explicit bundle"
build_entry "${ROOT_DIR}/src/auto.js" "${DIST_DIR}/m7.auto.bundle.v${VERSION}.min.js" "m7-js-lib auto bundle"

echo "Done."
