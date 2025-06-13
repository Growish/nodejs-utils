import morgan from 'morgan';
import winston from 'winston';
import 'winston-daily-rotate-file';
import { join } from 'path';

/**
 * HTTP logger instance based on Winston with daily rotation.
 * Logs HTTP requests in JSON format with timestamp.
 */
const httpLogger = winston.createLogger({
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
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
});

/**
 * Express middleware that logs HTTP requests using morgan + winston.
 */
const expressLogger = morgan('combined', {
    stream: {
        /**
         * Writes morgan log message to winston logger.
         * @param {string} message
         */
        write: (message) => httpLogger.info(message.trim())
    }
});

export default expressLogger;