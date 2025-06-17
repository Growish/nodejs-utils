import mongoose from 'mongoose';
import logger from '../logger.js';
import gracefulShutdown from '../graceful-shutdown.js';

const tag = 'connectionManager';

let retries = 0;
let isConnected = false;
let reconnect = true;

const config = {
    mongodbUri: '',
    maxRetry: 5,
    maxRetryDelay: 5000
};

/**
 * Connects to MongoDB using the provided configuration.
 * Retries up to `maxRetry` times with `maxRetryDelay` between attempts.
 *
 * @throws {Error} If connection fails after maximum retries.
 * @returns {Promise<void>}
 */
async function connectToDatabase() {
    while (retries < config.maxRetry && !isConnected) {
        try {
            await mongoose.connect(config.mongodbUri, {
                serverApi: { version: '1', strict: false, deprecationErrors: true }
            });
            isConnected = true;
            logger.info('db connection established', { tag });
            retries = 0;
        } catch (err) {
            retries++;
            logger.error(`db connection attempt ${retries}/${config.maxRetry} failed`, { tag, err });
            if (retries < config.maxRetry) {
                logger.info(`db connection retrying in ${config.maxRetryDelay / 1000}s...`, { tag });
                await new Promise((res) => setTimeout(res, config.maxRetryDelay));
            } else {
                throw new Error('db connection permanently failed.');
            }
        }
    }
}

/**
 * Disconnects from MongoDB.
 */
async function disconnectFromDatabase() {
    try {
        await mongoose.disconnect();
        logger.info('db disconnection closed succefully', { tag });
    } catch (err) {
        logger.error('db disconnection error', { tag, err });
    }
}

/**
 * Sets up automatic reconnection on MongoDB disconnection events.
 *
 * Listens to Mongoose `disconnected` event and triggers reconnection.
 */
function setupAutoReconnect() {
    mongoose.connection.on('disconnected', async () => {
        if (reconnect) {
            try {
                logger.warn('db disconnected, attemping to reconnect...', { tag });
                isConnected = false;
                await connectToDatabase();
            } catch (err) {
                logger.error('db reconnection error', { tag });
            }
        }
    });
}

/**
 * Initializes MongoDB connection and auto-reconnect behavior.
 *
 * @param {string} mongodbUri - MongoDB connection URI.
 * @param {number} [maxRetry=config.maxRetry] - Max number of retry attempts.
 * @param {number} [maxRetryDelay=config.maxRetryDelay] - Delay between retries (ms).
 * @returns {Promise<void>}
 */
export default async function connect(mongodbUri, maxRetry = config.maxRetry, maxRetryDelay = config.maxRetryDelay) {
    config.mongodbUri = mongodbUri;
    config.maxRetry = maxRetry;
    config.maxRetryDelay = maxRetryDelay;
    await connectToDatabase();
    setupAutoReconnect();
    // Register graceful shutdown to close MongoDB connection when shutting down
    gracefulShutdown.register(async () => {
        reconnect = false;
        await disconnectFromDatabase();
    }, tag, 20)
};