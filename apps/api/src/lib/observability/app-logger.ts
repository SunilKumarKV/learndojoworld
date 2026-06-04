type LogLevel = "debug" | "info" | "warn" | "error";

type LogContext = Record<string, unknown>;

const levelPriority: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const sensitiveKeyPattern =
  /(authorization|cookie|password|token|secret|api[_-]?key|dsn|signature|refresh)/i;

export class AppLogger {
  private readonly configuredLevel: LogLevel;
  private readonly isProduction: boolean;

  constructor(private readonly context: string) {
    this.configuredLevel = normalizeLevel(process.env.LOG_LEVEL);
    this.isProduction = process.env.NODE_ENV === "production";
  }

  debug(message: string, context?: LogContext) {
    this.write("debug", message, context);
  }

  info(message: string, context?: LogContext) {
    this.write("info", message, context);
  }

  warn(message: string, context?: LogContext) {
    this.write("warn", message, context);
  }

  error(message: string, context?: LogContext) {
    this.write("error", message, context);
  }

  private write(level: LogLevel, message: string, context?: LogContext) {
    if (levelPriority[level] < levelPriority[this.configuredLevel]) {
      return;
    }

    const payload = {
      context: this.context,
      level,
      message,
      timestamp: new Date().toISOString(),
      ...(context ? { data: redactValue(context) } : {}),
    };

    if (this.isProduction) {
      const line = JSON.stringify(payload);
      if (level === "error") {
        console.error(line);
        return;
      }
      if (level === "warn") {
        console.warn(line);
        return;
      }
      console.log(line);
      return;
    }

    const suffix = context ? ` ${JSON.stringify(redactValue(context))}` : "";
    const line = `[${payload.timestamp}] ${level.toUpperCase()} [${this.context}] ${message}${suffix}`;

    if (level === "error") {
      console.error(line);
      return;
    }
    if (level === "warn") {
      console.warn(line);
      return;
    }
    console.log(line);
  }
}

export function redactValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => redactValue(item));
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      sensitiveKeyPattern.test(key) ? "[REDACTED]" : redactValue(item),
    ]),
  );
}

function normalizeLevel(value: string | undefined): LogLevel {
  if (value === "debug" || value === "info" || value === "warn" || value === "error") {
    return value;
  }

  return "info";
}
