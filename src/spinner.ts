import pc from "picocolors";

const isLegacyWindows =
	process.platform === "win32" &&
	!process.env["WT_SESSION"] &&
	!process.env["TERM_PROGRAM"];

const FRAMES = isLegacyWindows
	? ["|", "/", "-", "\\"]
	: [
			"\u280B",
			"\u2819",
			"\u2839",
			"\u2838",
			"\u283C",
			"\u2834",
			"\u2826",
			"\u2827",
			"\u2807",
			"\u280F",
		];

const INTERVAL = 80;

export async function withSpinner<T>(
	message: string,
	fn: () => Promise<T>,
): Promise<T> {
	if (!process.stderr.isTTY) return fn();

	let i = 0;
	const timer = setInterval(() => {
		const frame = FRAMES[i++ % FRAMES.length];
		process.stderr.write(`\r${pc.cyan(frame)} ${pc.dim(message)}`);
	}, INTERVAL);

	try {
		return await fn();
	} finally {
		clearInterval(timer);
		process.stderr.write(`\r${" ".repeat(message.length + 4)}\r`);
	}
}
