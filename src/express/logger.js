import morgan from 'morgan';
import winston from 'winston';
import 'winston-daily-rotate-file';
import { mkdirSync } from 'fs';
import { join } from 'path';
const LOGS_DIRECTORY = join(process.cwd(), 'logs');

const ensureLogsDirectory = () => {
    mkdirSync(LOGS_DIRECTORY, { recursive: true });
};

const createLocalHttpTransports = () => {
    ensureLogsDirectory();

    return [
        new winston.transports.DailyRotateFile({
            level: 'info',
            handleExceptions: true,
            json: true,
            filename: join(process.cwd(), 'logs', 'http-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            zippedArchive: false,
            maxSize: '25m',
            maxFiles: '60d'
        })
    ]
};

const createCloudHttpTransports = () => {
    return [
        new winston.transports.Console({
            level: 'info',
            handleExceptions: true,
            stderrLevels: [ 'error' ],
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.printf(info => JSON.stringify({
                    timestamp: info.timestamp,
                    level: info.level.toUpperCase(),
                    mode: 'cloud',
                    type: 'http',
                    message: info.message || ''
                }))
            )
        })
    ];
};

const createHttpLogger = () => winston.createLogger({
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: createLocalHttpTransports()
});

const createHttpLoggerCloud = () => winston.createLogger({
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: createCloudHttpTransports()
});

const createExpressLogger = (loggerFactory) => {
    let middleware = null;

    return (req, res, next) => {
        if (!middleware) {
            const httpLogger = loggerFactory();

            middleware = morgan('combined', {
                stream: {
                    write: (message) => httpLogger.info(message.trim())
                }
            });
        }

        return middleware(req, res, next);
    };
};

/**
 * Express middleware that logs HTTP requests using morgan + winston.
 */
const expressLogger = createExpressLogger(createHttpLogger);
const expressLoggerCloud = createExpressLogger(createHttpLoggerCloud);

export default expressLogger;
export { expressLoggerCloud };
