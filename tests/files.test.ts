import { afterEach, describe, expect, it } from "bun:test";
import { rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { readInput } from "../src/files.js";

const TMP = resolve(tmpdir(), `nuntly-cli-files-test-${Date.now()}`);

afterEach(() => {
	rmSync(TMP, { recursive: true, force: true });
});

describe("readInput", () => {
	it("reads and parses a JSON file", () => {
		const filePath = resolve(tmpdir(), `nuntly-test-${Date.now()}.json`);
		writeFileSync(
			filePath,
			JSON.stringify({ from: "hello@acme.com", to: "user@example.com" }),
		);
		try {
			const result = readInput(filePath);
			expect(result).toEqual({
				from: "hello@acme.com",
				to: "user@example.com",
			});
		} finally {
			rmSync(filePath, { force: true });
		}
	});

	it("throws on invalid JSON", () => {
		const filePath = resolve(tmpdir(), `nuntly-test-bad-${Date.now()}.json`);
		writeFileSync(filePath, "not json");
		try {
			expect(() => readInput(filePath)).toThrow();
		} finally {
			rmSync(filePath, { force: true });
		}
	});

	it("throws on missing file", () => {
		expect(() => readInput("/nonexistent/path.json")).toThrow();
	});
});
