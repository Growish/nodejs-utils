import { createLogger, format, transports } from 'winston';
import 'winston-daily-rotate-file';
import { join } from 'path';
const { combine, timestamp, printf, colorize, json, splat } = format;

const consoleFormat = combine(
    timestamp(),
    printf(info => {
        return `${info.timestamp} [${info.level}] ${process.title}:${process.pid} [${info.tag || ''}]: ${info.message} ${extractInfo(info)}`;
    }),
);

const jsonFormat = printf(info => {
    return JSON.stringify({ timestamp: info.timestamp, level: info.level.toUpperCase(), process: process.title, pid: process.pid, tag: info.tag || '', message: info.message || '', extra: extractInfo(info) });
});

const extractInfo = (info) => {

    if(typeof info !== 'object')
        return info;

    let obj = {};

    for (let key in info) {
        if (info.hasOwnProperty(key)) {
            if (info[key] instanceof Error) {
                const err = info[key];
                const serialized = {
                    type: err.name,
                    message: err.message,
                    ...(err.code && { code: err.code }),
                    ...(err.status && { status: err.status })
                };

                if (err.isAxiosError) {
                    serialized.axios = {
                        method: err.config?.method,
                        url: err.config?.url,
                        data: err.config?.data,
                        status: err.response?.status,
                        responseData: err.response?.data,
                    };
                }
                obj[key] = serialized;
            } else if (key !== 'level' && key !== 'message' && key !== 'timestamp' && key !== 'tag') {
                obj[key] = info[key];
            }
        }
    }

    if (Object.keys(obj).length === 0)
        return "";

    return JSON.stringify(obj);
};

const options = {

    info: {
        level: 'info',
        handleExceptions: true,
        json: true,
        filename: join(process.cwd(), 'logs', 'info-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        zippedArchive: false,
        maxSize: '25m',
        maxFiles: '60d',
        format: combine( timestamp(), json(), splat(), jsonFormat )
    },

    error: {
        level: 'error',
        handleExceptions: true,
        json: true,
        filename: join(process.cwd(), 'logs', 'err-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        zippedArchive: false,
        maxSize: '25m',
        maxFiles: '60d',
        format: combine( timestamp(), json(), splat(), jsonFormat )
    },

    console: {
        level: 'debug',
        handleExceptions: true,
        json: false,
        format: combine( colorize(), consoleFormat )
    }
};

const logger = createLogger({
    transports: [
        new transports.DailyRotateFile(options.info),
        new transports.DailyRotateFile(options.error),
        new transports.Console(options.console)
    ],
    exitOnError: false
});

export default logger;
