import pc from "picocolors";

export type OutputFormat =
	| "json"
	| "raw"
	| "table"
	| "yaml"
	| "csv"
	| "markdown"
	| "quiet";

export interface OutputOpts {
	format?: string;
	quiet?: boolean;
	raw?: boolean;
	fields?: string;
	header?: boolean;
}

function extractItems(data: unknown): Record<string, unknown>[] | null {
	if (
		data &&
		typeof data === "object" &&
		"data" in data &&
		Array.isArray((data as any).data)
	)
		return (data as any).data;
	if (Array.isArray(data)) return data;
	return null;
}

function resolveKeys(
	items: Record<string, unknown>[],
	fields?: string[],
): string[] {
	const allKeys = Object.keys(items[0]);
	if (!fields) return allKeys;
	return fields.filter((f) => allKeys.includes(f));
}

export function formatOutput(
	data: unknown,
	format: OutputFormat,
	opts?: { fields?: string[]; noHeader?: boolean },
): string {
	const fields = opts?.fields;
	const noHeader = opts?.noHeader ?? false;

	if (format === "quiet") {
		if (data && typeof data === "object" && "id" in data) {
			return String((data as Record<string, unknown>).id);
		}
		return "";
	}

	if (format === "table") {
		const items = extractItems(data);

		if (items) {
			if (items.length === 0) return pc.dim("No results.");
			const keys = resolveKeys(items, fields);
			const widths = keys.map((k) =>
				Math.max(
					k.length,
					...items.map((r: any) => String(r[k] ?? "").slice(0, 40).length),
				),
			);
			const rows = items.map((r: any) =>
				keys
					.map((k, i) =>
						String(r[k] ?? "")
							.slice(0, 40)
							.padEnd(widths[i]),
					)
					.join("  "),
			);

			const parts: string[] = [];
			if (!noHeader) {
				const header = keys
					.map((k, i) => pc.bold(k.padEnd(widths[i])))
					.join("  ");
				parts.push(header, pc.dim("-".repeat(header.length)));
			}
			parts.push(...rows);
			const result = parts.join("\n");

			const nextCursor = (data as any)?.nextCursor;
			if (nextCursor)
				return result + "\n" + pc.dim(`next: --cursor ${nextCursor}`);
			return result;
		}

		return JSON.stringify(data, null, 2);
	}

	if (format === "raw") {
		return JSON.stringify(data);
	}

	if (format === "yaml") {
		return toYaml(data);
	}

	if (format === "csv") {
		const items = extractItems(data);

		const escapeCsv = (v: unknown): string => {
			const s =
				typeof v === "object" && v !== null
					? JSON.stringify(v)
					: String(v ?? "");
			return s.includes(",") || s.includes('"') || s.includes("\n")
				? `"${s.replace(/"/g, '""')}"`
				: s;
		};

		if (items && items.length > 0) {
			const keys = resolveKeys(items, fields);
			const rows = items.map((r: any) =>
				keys.map((k) => escapeCsv(r[k])).join(","),
			);
			if (noHeader) return rows.join("\r\n");
			return [keys.join(","), ...rows].join("\r\n");
		}

		if (data && typeof data === "object") {
			const entries = Object.entries(data as Record<string, unknown>);
			if (noHeader)
				return entries.map(([k, v]) => `${k},${escapeCsv(v)}`).join("\r\n");
			return [
				"field,value",
				...entries.map(([k, v]) => `${k},${escapeCsv(v)}`),
			].join("\r\n");
		}

		return String(data);
	}

	if (format === "markdown") {
		const items = extractItems(data);

		if (items && items.length > 0) {
			const keys = resolveKeys(items, fields);
			const header = "| " + keys.join(" | ") + " |";
			const sep = "| " + keys.map(() => "---").join(" | ") + " |";
			const rows = items.map(
				(r: any) =>
					"| " +
					keys.map((k) => String(r[k] ?? "").slice(0, 60)).join(" | ") +
					" |",
			);
			if (noHeader) return rows.join("\n");
			return [header, sep, ...rows].join("\n");
		}

		if (data && typeof data === "object") {
			const entries = Object.entries(data as Record<string, unknown>);
			const header = "| Field | Value |";
			const sep = "| --- | --- |";
			const rows = entries.map(
				([k, v]) =>
					`| ${k} | ${typeof v === "object" ? JSON.stringify(v) : String(v)} |`,
			);
			if (noHeader) return rows.join("\n");
			return [header, sep, ...rows].join("\n");
		}

		return String(data);
	}

	return JSON.stringify(data, null, 2);
}

function toYaml(data: unknown, indent = 0): string {
	const prefix = "  ".repeat(indent);
	if (data === null || data === undefined) return `${prefix}null`;
	if (typeof data === "string")
		return data.includes("\n") ? `${prefix}|\\n${data}` : `${prefix}${data}`;
	if (typeof data === "number" || typeof data === "boolean")
		return `${prefix}${data}`;
	if (Array.isArray(data)) {
		if (data.length === 0) return `${prefix}[]`;
		return data
			.map((item) => {
				if (typeof item === "object" && item !== null) {
					const inner = toYaml(item, indent + 1).trim();
					return `${prefix}- ${inner.replace(/\n/g, "\n" + prefix + "  ")}`;
				}
				return `${prefix}- ${item}`;
			})
			.join("\n");
	}
	if (typeof data === "object") {
		return Object.entries(data as Record<string, unknown>)
			.map(([key, value]) => {
				if (value === null || value === undefined)
					return `${prefix}${key}: null`;
				if (typeof value === "object")
					return `${prefix}${key}:\n${toYaml(value, indent + 1)}`;
				return `${prefix}${key}: ${value}`;
			})
			.join("\n");
	}
	return `${prefix}${String(data)}`;
}

export function printResult(data: unknown, opts: OutputOpts) {
	let format: OutputFormat;
	if (opts.quiet) format = "quiet";
	else if (opts.raw) format = "raw";
	else if (opts.format) format = opts.format as OutputFormat;
	else if (!process.stdout.isTTY) format = "json";
	else {
		const isArray =
			Array.isArray(data) ||
			(data &&
				typeof data === "object" &&
				"data" in data &&
				Array.isArray((data as any).data));
		format = isArray ? "table" : "json";
	}

	const fields = opts.fields?.split(",").map((f) => f.trim());
	const noHeader = opts.header === false;
	const output = formatOutput(data, format, { fields, noHeader });
	if (output) console.log(output);
}

function isJsonMode(opts?: OutputOpts): boolean {
	if (opts?.format === "json" || opts?.raw) return true;
	if (!opts?.format && !opts?.quiet && !process.stdout.isTTY) return true;
	return false;
}

export function printError(error: unknown, opts?: OutputOpts) {
	const e = error as any;
	const isApi = !!e?.status;

	if (isJsonMode(opts)) {
		const envelope = {
			error: {
				code: isApi ? `HTTP_${e.status}` : "CLIENT_ERROR",
				message: e?.body?.message ?? e?.message ?? String(error),
				...(e?.requestId && { requestId: e.requestId }),
				...(e?.body?.errors && { fields: e.body.errors }),
			},
		};
		console.error(JSON.stringify(envelope));
	} else {
		if (isApi) {
			console.error(
				pc.red(`HTTP ${e.status}: ${e.body?.message ?? e.message}`),
			);
			if (e.requestId) console.error(pc.dim(`request: ${e.requestId}`));
			if (e.body?.errors) {
				for (const err of e.body.errors) {
					console.error(pc.yellow(`  ${err.field}: ${err.message}`));
				}
			}
		} else {
			console.error(pc.red(e?.message ?? String(error)));
		}
	}

	process.exit(isApi ? 1 : 2);
}
