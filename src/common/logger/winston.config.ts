import { format, transports } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const baseFormat = format.printf(
  ({ timestamp, level, message, context, trace }) =>
    `${timestamp} [${level}] ${context ? `[${context}] ` : ''}${message}${trace ? `\n${trace}` : ''}`,
);

const consoleFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.colorize(),
  baseFormat,
);

const fileFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  baseFormat,
);

export const winstonConfig = {
  transports: [
    new transports.Console({
      format: consoleFormat,
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    }),
    new DailyRotateFile({
      format: fileFormat,
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      level: 'error',
    }),
    new DailyRotateFile({
      format: fileFormat,
      filename: 'logs/application-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
    }),
  ],
};
