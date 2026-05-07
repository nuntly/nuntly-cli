import { describe, expect, it } from "bun:test";
import { formatOutput } from "../src/output.js";

const ITEMS = [
	{ id: "em_001", status: "delivered", subject: "Welcome" },
	{ id: "em_002", status: "bounced", subject: "Reset password" },
];

const PAGINATED = { data: ITEMS, nextCursor: "cur_abc" };

const SINGLE = { id: "em_001", status: "delivered", from: "hello@acme.com" };

// --- JSON ---

describe("formatOutput json", () => {
	it("pretty-prints single object", () => {
		const out = formatOutput(SINGLE, "json");
		expect(JSON.parse(out)).toEqual(SINGLE);
		expect(out).toContain("\n"); // pretty, not compact
	});

	it("pretty-prints array", () => {
		const out = formatOutput(ITEMS, "json");
		expect(JSON.parse(out)).toEqual(ITEMS);
	});
});

// --- RAW ---

describe("formatOutput raw", () => {
	it("outputs compact JSON", () => {
		const out = formatOutput(SINGLE, "raw");
		expect(out).not.toContain("\n");
		expect(JSON.parse(out)).toEqual(SINGLE);
	});
});

// --- QUIET ---

describe("formatOutput quiet", () => {
	it("returns only the id", () => {
		expect(formatOutput(SINGLE, "quiet")).toBe("em_001");
	});

	it("returns empty string when no id", () => {
		expect(formatOutput({ status: "ok" }, "quiet")).toBe("");
	});
});

// --- CSV ---

describe("formatOutput csv", () => {
	it("renders header + rows for arrays", () => {
		const out = formatOutput(ITEMS, "csv");
		const lines = out.split(/\r?\n/);
		expect(lines[0]).toBe("id,status,subject");
		expect(lines[1]).toBe("em_001,delivered,Welcome");
		expect(lines[2]).toBe("em_002,bounced,Reset password");
	});

	it("uses CRLF line endings per RFC 4180", () => {
		const out = formatOutput(ITEMS, "csv");
		expect(out).toContain("\r\n");
	});

	it("renders paginated data", () => {
		const out = formatOutput(PAGINATED, "csv");
		const lines = out.split(/\r?\n/);
		expect(lines[0]).toBe("id,status,subject");
		expect(lines.length).toBe(3); // header + 2 rows
	});

	it("escapes commas in values", () => {
		const data = [{ name: "hello, world", id: "1" }];
		const out = formatOutput(data, "csv");
		expect(out).toContain('"hello, world"');
	});

	it("escapes double quotes in values", () => {
		const data = [{ name: 'say "hi"', id: "1" }];
		const out = formatOutput(data, "csv");
		expect(out).toContain('"say ""hi"""');
	});

	it("renders single object as field,value", () => {
		const out = formatOutput({ id: "x", status: "ok" }, "csv");
		const lines = out.split(/\r?\n/);
		expect(lines[0]).toBe("field,value");
		expect(lines[1]).toBe("id,x");
	});
});

// --- YAML ---

describe("formatOutput yaml", () => {
	it("renders object fields", () => {
		const out = formatOutput({ name: "test", count: 3 }, "yaml");
		expect(out).toContain("name: test");
		expect(out).toContain("count: 3");
	});

	it("renders null values", () => {
		const out = formatOutput({ key: null }, "yaml");
		expect(out).toContain("key: null");
	});

	it("renders empty array", () => {
		const out = formatOutput({ items: [] }, "yaml");
		expect(out).toContain("items:\n  []");
	});
});

// --- MARKDOWN ---

describe("formatOutput markdown", () => {
	it("renders header + separator + rows for arrays", () => {
		const out = formatOutput(ITEMS, "markdown");
		const lines = out.split("\n");
		expect(lines[0]).toBe("| id | status | subject |");
		expect(lines[1]).toBe("| --- | --- | --- |");
		expect(lines[2]).toContain("em_001");
	});

	it("renders single object as field/value table", () => {
		const out = formatOutput({ id: "x", status: "ok" }, "markdown");
		expect(out).toContain("| Field | Value |");
		expect(out).toContain("| id | x |");
	});
});

// --- TABLE ---

describe("formatOutput table", () => {
	it("renders rows for arrays", () => {
		const out = formatOutput(ITEMS, "table");
		expect(out).toContain("em_001");
		expect(out).toContain("em_002");
	});

	it("shows pagination cursor hint", () => {
		const out = formatOutput(PAGINATED, "table");
		expect(out).toContain("--cursor cur_abc");
	});

	it('shows "No results." for empty array', () => {
		const out = formatOutput([], "table");
		expect(out).toContain("No results.");
	});

	it("falls back to JSON for single objects", () => {
		const out = formatOutput(SINGLE, "table");
		expect(JSON.parse(out)).toEqual(SINGLE);
	});
});

// --- --fields ---

describe("--fields filter", () => {
	it("filters csv columns", () => {
		const out = formatOutput(ITEMS, "csv", { fields: ["id", "status"] });
		const lines = out.split(/\r?\n/);
		expect(lines[0]).toBe("id,status");
		expect(lines[1]).toBe("em_001,delivered");
	});

	it("filters table columns", () => {
		const out = formatOutput(ITEMS, "table", { fields: ["id"] });
		expect(out).toContain("em_001");
		expect(out).not.toContain("delivered");
		expect(out).not.toContain("Welcome");
	});

	it("filters markdown columns", () => {
		const out = formatOutput(ITEMS, "markdown", { fields: ["id", "subject"] });
		expect(out).toContain("| id | subject |");
		expect(out).not.toContain("status");
	});

	it("ignores unknown field names", () => {
		const out = formatOutput(ITEMS, "csv", { fields: ["id", "nonexistent"] });
		const lines = out.split(/\r?\n/);
		expect(lines[0]).toBe("id");
	});
});

// --- --no-header ---

describe("--no-header", () => {
	it("omits csv header", () => {
		const out = formatOutput(ITEMS, "csv", { noHeader: true });
		const lines = out.split(/\r?\n/);
		expect(lines[0]).toBe("em_001,delivered,Welcome");
		expect(lines.length).toBe(2);
	});

	it("omits table header and separator", () => {
		const out = formatOutput(ITEMS, "table", { noHeader: true });
		expect(out).not.toContain("---");
		// First line should be data, not header
		expect(out.split("\n")[0]).toContain("em_001");
	});

	it("omits markdown header", () => {
		const out = formatOutput(ITEMS, "markdown", { noHeader: true });
		expect(out).not.toContain("| id |");
		expect(out).not.toContain("| --- |");
		expect(out.split("\n")[0]).toContain("em_001");
	});
});
