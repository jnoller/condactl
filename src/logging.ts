import winston, { Logger } from "winston";
import os from "os";
import path from "path";

const createLogger = (level?: string, logsDir?: string): Logger => {
  const defaultLevel = level || "debug";
  const defaultLogsDir = logsDir || path.join(os.homedir(), ".cope", "logs");

  const format = winston.format.combine(
    winston.format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss",
    }),
    winston.format.printf((info) => {
      return `${info.timestamp} ${info.level}: ${info.message}`;
    })
  );

  const logger = winston.createLogger({
    level: defaultLevel,
    format,
    transports: [
      new winston.transports.Console({ level: defaultLevel, format }),
      new winston.transports.File({ filename: path.join(defaultLogsDir, "error.log"), level: "error", format }),
      new winston.transports.File({ filename: path.join(defaultLogsDir, "combined.log"), format }),
    ],
  });

  return logger;
};

export default createLogger;
