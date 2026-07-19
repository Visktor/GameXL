#!/usr/bin/env bash
# Set up a fresh git worktree's dev env: copy the gitignored .env files from
# the main checkout, then assign the web and server dev ports by finding the
# next free port starting from this repo's conventional defaults (5180 for
# web, 3000 for server) and patching every cross-referencing var
# (VITE_SERVER_URL, CORS_ORIGIN) so the two never collide with another
# worktree's (or the main checkout's) already-running dev servers.
#
# Usage: scripts/setup-worktree-env.sh <worktree-path>

set -euo pipefail

WEB_BASE_PORT=5180
SERVER_BASE_PORT=3000

FIND_FREE_PORT="$HOME/.claude/skills/pv-worktree/scripts/find-free-port.sh"

worktree_path="${1:?usage: setup-worktree-env.sh <worktree-path>}"
worktree_path="$(cd "$worktree_path" && pwd)"

if [ ! -x "$FIND_FREE_PORT" ]; then
	echo "setup-worktree-env: missing helper script at $FIND_FREE_PORT" >&2
	exit 1
fi

main_root="$(dirname "$(git -C "$worktree_path" rev-parse --git-common-dir)")"
main_root="$(cd "$main_root" && pwd)"

if [ "$main_root" = "$worktree_path" ]; then
	echo "setup-worktree-env: $worktree_path looks like the main checkout, not a linked worktree" >&2
	exit 1
fi

# Web is read both by `vite dev` (mode "development" -> .env.development) and
# by Vitest (mode "test" -> plain .env, which Vite always loads regardless of
# mode) — both need to exist and both need their PORT/VITE_SERVER_URL patched,
# or `vitest run` fails with "Invalid environment variables" in a fresh worktree.
web_env_dev_main="$main_root/apps/web/.env.development"
web_env_plain_main="$main_root/apps/web/.env"
server_env_main="$main_root/apps/server/.env.development"
native_env_main="$main_root/apps/native/.env"

web_env_dev_wt="$worktree_path/apps/web/.env.development"
web_env_plain_wt="$worktree_path/apps/web/.env"
server_env_wt="$worktree_path/apps/server/.env.development"
native_env_wt="$worktree_path/apps/native/.env"

for pair in "$web_env_dev_main:$web_env_dev_wt" "$web_env_plain_main:$web_env_plain_wt" "$server_env_main:$server_env_wt" "$native_env_main:$native_env_wt"; do
	src="${pair%%:*}"
	dest="${pair##*:}"
	if [ -f "$src" ]; then
		mkdir -p "$(dirname "$dest")"
		cp "$src" "$dest"
	fi
done

web_port="$("$FIND_FREE_PORT" "$WEB_BASE_PORT")"
server_port="$("$FIND_FREE_PORT" "$SERVER_BASE_PORT")"

for web_env_wt in "$web_env_dev_wt" "$web_env_plain_wt"; do
	if [ -f "$web_env_wt" ]; then
		if grep -q "^PORT=" "$web_env_wt"; then
			sed -i '' "s/^PORT=.*/PORT=${web_port}/" "$web_env_wt"
		else
			echo "PORT=${web_port}" >>"$web_env_wt"
		fi
		if grep -q "^VITE_SERVER_URL=" "$web_env_wt"; then
			sed -i '' "s#^VITE_SERVER_URL=.*#VITE_SERVER_URL=http://localhost:${server_port}#" "$web_env_wt"
		fi
	fi
done

if [ -f "$server_env_wt" ]; then
	if grep -q "^PORT=" "$server_env_wt"; then
		sed -i '' "s/^PORT=.*/PORT=${server_port}/" "$server_env_wt"
	else
		echo "PORT=${server_port}" >>"$server_env_wt"
	fi
	if grep -q "^CORS_ORIGIN=" "$server_env_wt"; then
		sed -i '' "s#^CORS_ORIGIN=.*#CORS_ORIGIN=http://localhost:${web_port}#" "$server_env_wt"
	fi
fi

echo "web:    http://localhost:${web_port}"
echo "server: http://localhost:${server_port}"
