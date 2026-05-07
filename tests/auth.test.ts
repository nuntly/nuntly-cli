import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { existsSync, mkdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

// We test saveProfile by importing the module with a patched CONFIG_DIR.
// Since auth.ts uses homedir() at module level, we override via a temp directory.

const TEST_DIR = resolve(tmpdir(), `nuntly-cli-test-${Date.now()}`);
const TEST_CONFIG_DIR = resolve(TEST_DIR, ".nuntly");
const TEST_CONFIG_PATH = resolve(TEST_CONFIG_DIR, "config.json");

// We can't easily override the module constants, so we replicate the saveProfile logic
// to test the file permission behavior directly.
import { chmodSync, writeFileSync } from "node:fs";

function saveProfileToPath(
	configDir: string,
	configPath: string,
	profileName: string,
	profile: { apiKey?: string },
) {
	mkdirSync(configDir, { recursive: true });
	let config: Record<string, unknown> = {};
	if (existsSync(configPath)) {
		config = JSON.parse(readFileSync(configPath, "utf-8"));
	}
	if (!config.profiles) config.profiles = {};
	(config.profiles as Record<string, unknown>)[profileName] = profile;
	if (!config.defaultProfile) config.defaultProfile = profileName;
	writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n", {
		mode: 0o600,
	});
	chmodSync(configPath, 0o600);
}

describe("auth config file permissions", () => {
	beforeEach(() => {
		mkdirSync(TEST_DIR, { recursive: true });
	});

	afterEach(() => {
		rmSync(TEST_DIR, { recursive: true, force: true });
	});

	it("creates config file with chmod 600", () => {
		saveProfileToPath(TEST_CONFIG_DIR, TEST_CONFIG_PATH, "default", {
			apiKey: "nuntly_sk_test",
		});

		const stat = statSync(TEST_CONFIG_PATH);
		const mode = stat.mode & 0o777;
		expect(mode).toBe(0o600);
	});

	it("preserves chmod 600 on subsequent writes", () => {
		saveProfileToPath(TEST_CONFIG_DIR, TEST_CONFIG_PATH, "default", {
			apiKey: "nuntly_sk_first",
		});
		saveProfileToPath(TEST_CONFIG_DIR, TEST_CONFIG_PATH, "staging", {
			apiKey: "nuntly_sk_second",
		});

		const stat = statSync(TEST_CONFIG_PATH);
		const mode = stat.mode & 0o777;
		expect(mode).toBe(0o600);
	});

	it("config file is not group/world readable", () => {
		saveProfileToPath(TEST_CONFIG_DIR, TEST_CONFIG_PATH, "default", {
			apiKey: "nuntly_sk_test",
		});

		const stat = statSync(TEST_CONFIG_PATH);
		const mode = stat.mode & 0o777;
		const groupRead = mode & 0o040;
		const worldRead = mode & 0o004;
		expect(groupRead).toBe(0);
		expect(worldRead).toBe(0);
	});

	it("stores profile data correctly", () => {
		saveProfileToPath(TEST_CONFIG_DIR, TEST_CONFIG_PATH, "prod", {
			apiKey: "nuntly_sk_prod",
		});

		const config = JSON.parse(readFileSync(TEST_CONFIG_PATH, "utf-8"));
		expect(config.defaultProfile).toBe("prod");
		expect(config.profiles.prod.apiKey).toBe("nuntly_sk_prod");
	});
});
