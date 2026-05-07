import { execSync } from "node:child_process";
import {
	chmodSync,
	existsSync,
	mkdirSync,
	readFileSync,
	writeFileSync,
} from "node:fs";
import { homedir, platform } from "node:os";
import { resolve } from "node:path";
import * as p from "@clack/prompts";
import pc from "picocolors";

export type OutputFormat = "json" | "table" | "yaml" | "markdown" | "quiet";

export interface ProfileConfig {
	apiKey?: string;
	baseUrl?: string;
	outputFormat?: OutputFormat;
}

export interface NuntlyConfig {
	defaultProfile?: string;
	profiles?: Record<string, ProfileConfig>;
	// Legacy flat fields (migrated to profiles.default on read)
	apiKey?: string;
	baseUrl?: string;
	outputFormat?: OutputFormat;
}

export const CONFIG_DIR = resolve(homedir(), ".nuntly");
export const CONFIG_PATH = resolve(CONFIG_DIR, "config.json");

function loadRawConfig(): NuntlyConfig {
	if (!existsSync(CONFIG_PATH)) return {};
	try {
		return JSON.parse(readFileSync(CONFIG_PATH, "utf-8"));
	} catch {
		return {};
	}
}

function resolveProfile(
	config: NuntlyConfig,
	profileName?: string,
): ProfileConfig {
	// Legacy flat config: treat as default profile
	if (!config.profiles && config.apiKey) {
		return {
			apiKey: config.apiKey,
			baseUrl: config.baseUrl,
			outputFormat: config.outputFormat,
		};
	}
	const name = profileName ?? config.defaultProfile ?? "default";
	return config.profiles?.[name] ?? {};
}

function restrictFilePermissions(filePath: string): void {
	if (platform() === "win32") {
		try {
			execSync(
				`icacls "${filePath}" /inheritance:r /grant:r "%USERNAME%:(R,W)" /q`,
				{ stdio: "ignore" },
			);
		} catch {
			// icacls may not be available in all Windows environments
		}
	} else {
		chmodSync(filePath, 0o600);
	}
}

export function saveProfile(profileName: string, profile: ProfileConfig): void {
	mkdirSync(CONFIG_DIR, { recursive: true });
	const config = loadRawConfig();
	if (!config.profiles) config.profiles = {};
	config.profiles[profileName] = {
		...config.profiles[profileName],
		...profile,
	};
	if (!config.defaultProfile) config.defaultProfile = profileName;
	// Remove legacy flat fields
	delete config.apiKey;
	delete config.baseUrl;
	delete config.outputFormat;
	writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2) + "\n", {
		mode: 0o600,
	});
	restrictFilePermissions(CONFIG_PATH);
}

export function listProfiles(): string[] {
	const config = loadRawConfig();
	return Object.keys(config.profiles ?? {});
}

function getGlobalProfile(): string | undefined {
	const idx = process.argv.indexOf("--profile");
	if (idx >= 0 && idx + 1 < process.argv.length) return process.argv[idx + 1];
	return process.env["NUNTLY_PROFILE"] ?? undefined;
}

export function resolveApiKey(flagKey?: string, profileName?: string): string {
	const config = loadRawConfig();
	const profile = resolveProfile(config, profileName ?? getGlobalProfile());
	const key = flagKey ?? process.env["NUNTLY_API_KEY"] ?? profile.apiKey;
	if (!key) {
		console.error(pc.red("Error: API key not found."));
		console.error(
			`Run ${pc.bold("nuntly login")}, set ${pc.bold("NUNTLY_API_KEY")} env var, or use ${pc.bold("--api-key")}`,
		);
		if (profileName) console.error(pc.dim(`Profile: ${profileName}`));
		process.exit(1);
	}
	if (flagKey) {
		console.error(
			pc.yellow(
				"Warning: passing API key via flag is less secure than env var.",
			),
		);
	}
	return key;
}

export function resolveBaseUrl(
	flagUrl?: string,
	profileName?: string,
): string | undefined {
	const config = loadRawConfig();
	const profile = resolveProfile(config, profileName ?? getGlobalProfile());
	return flagUrl ?? process.env["NUNTLY_BASE_URL"] ?? profile.baseUrl;
}

export function resolveOutputFormat(
	profileName?: string,
): OutputFormat | undefined {
	const config = loadRawConfig();
	const profile = resolveProfile(config, profileName);
	return profile.outputFormat;
}

export async function login(profileName?: string): Promise<void> {
	const name = profileName ?? "default";
	p.intro(
		pc.bold(`Nuntly Login${name !== "default" ? ` (profile: ${name})` : ""}`),
	);

	const apiKey = await p.text({
		message: "Enter your API key",
		placeholder: "nuntly_sk_...",
		validate: (value) => {
			if (!value || value.trim().length === 0) return "API key is required";
			return undefined;
		},
	});

	if (p.isCancel(apiKey)) {
		p.cancel("Login cancelled.");
		process.exit(0);
	}

	const baseUrl = await p.text({
		message: "API base URL (leave empty for default)",
		placeholder: "https://api.nuntly.com",
	});

	if (p.isCancel(baseUrl)) {
		p.cancel("Login cancelled.");
		process.exit(0);
	}

	const profile: ProfileConfig = { apiKey: apiKey.trim() };
	if (baseUrl && baseUrl.trim()) profile.baseUrl = baseUrl.trim();

	saveProfile(name, profile);

	p.note(`Profile "${name}" saved to ${pc.dim(CONFIG_PATH)}`, "Saved");
	p.outro(pc.green("Logged in successfully."));
}

export async function confirmDelete(
	resource: string,
	id: string,
): Promise<boolean> {
	const result = await p.confirm({
		message: `Delete ${resource} ${pc.bold(id)}?`,
	});
	if (p.isCancel(result)) return false;
	return result;
}
