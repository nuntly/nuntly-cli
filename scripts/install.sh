#!/usr/bin/env bash
# Nuntly CLI installer
#
# Usage:
#   curl -fsSL https://nuntly.com/install.sh | bash
#   curl -fsSL https://nuntly.com/install.sh | bash -s -- --version v1.2.3
#
# Environment overrides:
#   NUNTLY_INSTALL_DIR  install directory (default: ~/.nuntly)
#   NUNTLY_VERSION      version to install (default: latest)

set -euo pipefail

GITHUB_REPO="${NUNTLY_GITHUB_REPO:-nuntly/nuntly-cli}"
INSTALL_DIR="${NUNTLY_INSTALL_DIR:-$HOME/.nuntly}"
BIN_DIR="$INSTALL_DIR/bin"
VERSION="${NUNTLY_VERSION:-latest}"

red()    { printf '\033[31m%s\033[0m' "$1"; }
green()  { printf '\033[32m%s\033[0m' "$1"; }
yellow() { printf '\033[33m%s\033[0m' "$1"; }
bold()   { printf '\033[1m%s\033[0m' "$1"; }

err() { echo "$(red error:) $*" >&2; exit 1; }
log() { echo "$(green info:) $*"; }

while [ $# -gt 0 ]; do
  case "$1" in
    --version) VERSION="$2"; shift 2 ;;
    --install-dir) INSTALL_DIR="$2"; BIN_DIR="$INSTALL_DIR/bin"; shift 2 ;;
    *) err "unknown flag: $1" ;;
  esac
done

require() {
  command -v "$1" >/dev/null 2>&1 || err "missing required command: $1"
}
require curl
require uname
require chmod
require mkdir
command -v shasum >/dev/null 2>&1 || command -v sha256sum >/dev/null 2>&1 \
  || err "missing required command: shasum or sha256sum"

detect_platform() {
  local os arch
  os="$(uname -s | tr '[:upper:]' '[:lower:]')"
  arch="$(uname -m)"

  case "$os" in
    darwin) os="darwin" ;;
    linux)  os="linux"  ;;
    *) err "unsupported OS: $os (Windows users: use install.ps1)" ;;
  esac

  case "$arch" in
    x86_64|amd64) arch="x64" ;;
    arm64|aarch64) arch="arm64" ;;
    *) err "unsupported architecture: $arch" ;;
  esac

  echo "${os}-${arch}"
}

resolve_url() {
  local platform="$1"
  local file="nuntly-${platform}"
  if [ "$VERSION" = "latest" ]; then
    echo "https://github.com/${GITHUB_REPO}/releases/latest/download/${file}"
  else
    echo "https://github.com/${GITHUB_REPO}/releases/download/${VERSION}/${file}"
  fi
}

verify_checksum() {
  local file="$1" expected_url="$2"
  local expected actual
  expected="$(curl -fsSL "$expected_url" | awk '{print $1}')" || err "failed to download checksum from $expected_url"
  if command -v sha256sum >/dev/null 2>&1; then
    actual="$(sha256sum "$file" | awk '{print $1}')"
  else
    actual="$(shasum -a 256 "$file" | awk '{print $1}')"
  fi
  [ "$expected" = "$actual" ] || err "checksum mismatch (expected $expected, got $actual)"
}

main() {
  local platform url checksum_url tmp
  platform="$(detect_platform)"
  url="$(resolve_url "$platform")"
  checksum_url="${url}.sha256"

  log "downloading $(bold "nuntly") for $(bold "$platform") (version: $VERSION)"
  tmp="$(mktemp -d)"
  trap 'rm -rf "$tmp"' EXIT

  curl -fsSL --output "$tmp/nuntly" "$url" || err "download failed: $url"
  verify_checksum "$tmp/nuntly" "$checksum_url"

  mkdir -p "$BIN_DIR"
  mv "$tmp/nuntly" "$BIN_DIR/nuntly"
  chmod +x "$BIN_DIR/nuntly"

  log "installed to $(bold "$BIN_DIR/nuntly")"

  if ! echo "$PATH" | tr ':' '\n' | grep -Fxq "$BIN_DIR"; then
    echo
    yellow "Add the Nuntly CLI to your PATH"; echo
    echo "  echo 'export PATH=\"$BIN_DIR:\$PATH\"' >> ~/.bashrc   # or ~/.zshrc, ~/.profile"
    echo "  source ~/.bashrc"
    echo
  fi

  echo
  "$BIN_DIR/nuntly" --version 2>/dev/null || true
  echo
  green "Nuntly CLI installed."; echo
  echo "Next steps:"
  echo "  $(bold "nuntly login")           # authenticate"
  echo "  $(bold "nuntly emails list")     # send your first email"
  echo "  Documentation: https://nuntly.com/docs/cli"
}

main
