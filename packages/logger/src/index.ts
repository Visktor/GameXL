import { env } from "@GameXL/env/server";
import { randomUUID } from "node:crypto";
import type { MiddlewareHandler } from "hono";
import pino from "pino";

type PinoInstance = ReturnType<typeof pino>;
type LogArgs = [msg: string] | [obj: Record<string, unknown>, msg?: string];

const REDACT_PATHS = [
	"req.headers.authorization",
	"req.headers.cookie",
	"*.token",
	"*.password",
	"*.fingerprint",
];

export interface RequestVariables {
	logger: PinoInstance;
	requestId: string;
}

function createRootLogger(): PinoInstance {
	if (env.NODE_ENV === "test") {
		return pino({ level: "silent" });
	}

	return pino({
		level: env.LOG_LEVEL,
		redact: REDACT_PATHS,
		transport:
			env.NODE_ENV === "development" ? { target: "pino-pretty" } : undefined,
	});
}

function emit(
	logger: PinoInstance,
	level: "error" | "info" | "warn",
	args: LogArgs
): void {
	const [objOrMsg, msg] = args;
	if (typeof objOrMsg === "string") {
		logger[level](objOrMsg);
	} else {
		logger[level](objOrMsg, msg);
	}
}

function levelForStatus(status: number): "error" | "info" | "warn" {
	if (status >= 500) {
		return "error";
	}
	if (status >= 400) {
		return "warn";
	}
	return "info";
}

export class Logger {
	private static readonly root: PinoInstance = createRootLogger();

	static info(...args: LogArgs): void {
		emit(Logger.root, "info", args);
	}

	static warn(...args: LogArgs): void {
		emit(Logger.root, "warn", args);
	}

	static error(...args: LogArgs): void {
		emit(Logger.root, "error", args);
	}

	static child(bindings: Record<string, unknown>): PinoInstance {
		return Logger.root.child(bindings);
	}

	static requestMiddleware(): MiddlewareHandler<{
		Variables: RequestVariables;
	}> {
		return async (c, next) => {
			const requestId = c.req.header("x-request-id") ?? randomUUID();
			const logger = Logger.child({ requestId });
			c.set("logger", logger);
			c.set("requestId", requestId);

			const start = performance.now();
			await next();
			const durationMs = Math.round(performance.now() - start);
			const status = c.res.status;

			logger[levelForStatus(status)](
				{
					method: c.req.method,
					path: c.req.path,
					status,
					durationMs,
				},
				"request completed"
			);
		};
	}
}
