import { readFileSync, readSync } from "node:fs";

function readStdin(): string {
	const chunks: Buffer[] = [];
	const buf = Buffer.alloc(4096);
	try {
		let bytesRead: number;
		while ((bytesRead = readSync(0, buf, 0, buf.length, null)) > 0) {
			chunks.push(buf.subarray(0, bytesRead));
		}
	} catch (e: any) {
		if (e.code !== "EOF" && e.code !== "EAGAIN") throw e;
	}
	return Buffer.concat(chunks).toString("utf-8");
}

export function readInput(filePath: string): unknown {
	const raw = filePath === "-" ? readStdin() : readFileSync(filePath, "utf-8");
	return JSON.parse(raw);
}
