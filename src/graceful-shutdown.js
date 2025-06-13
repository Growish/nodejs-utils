import logger from './logger.js';

const tag = 'gracefulShutdown';

let shuttingDown = false;
const handlers = [];

const SHUTDOWN_TIMEOUT = 10000;

/**
 * Registers a handler function to be executed during the graceful shutdown process.
 * Handlers are executed in descending order of priority (higher priority first).
 *
 * @param {() => Promise<void> | void} handler - The function to execute on shutdown. Can be async or sync.
 * @param {string} [name='anonymous'] - Descriptive name for the handler used in logging.
 * @param {number} [priority=0] - Priority of the handler; higher values run earlier.
 */
function register(handler, name = 'anonymous', priority = 0) {
    handlers.push({ handler, name, priority });
}

/**
 * Initiates the graceful shutdown process triggered by a system signal or error.
 * Executes all registered handlers respecting priority and enforces a timeout.
 * Exits the process when shutdown completes or times out.
 *
 * @param {string} signal - The signal or event name that triggered the shutdown.
 * @returns {Promise<void>} Resolves when shutdown handlers have completed or timeout occurs.
 */
async function shutdown(signal) {
    if (shuttingDown) {
        logger.warn(`already shutting down, ignoring ${signal}`, { tag })
        console.warn(`[graceful-shutdown] Already shutting down, ignoring ${signal}`);
        return;
    }
    shuttingDown = true;

    logger.info(`received ${signal}, starting shutdown`, { tag });

    const timeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('graceful shutdown timed out')), SHUTDOWN_TIMEOUT);
    });

    const orderedHandlers = handlers.sort((a, b) => b.priority - a.priority);

    const tasks = orderedHandlers.map(({ handler, name }) => {
        return (async () => {
            try {
                logger.info(`running handler: ${name}`, { tag });
                await handler();
                logger.info(`completed handler: ${name}`, { tag });
            } catch (err) {
                logger.error(`error in handler: ${name}`, { tag, err });
            }
        })();
    });

    try {
        await Promise.race([Promise.all(tasks), timeout]);
        logger.info('all handlers finished successfully', { tag });
    } catch (err) {
        logger.error('shutdown error detected', { tag, err });
    } finally {
        process.exit(0);
    }
}

// Listen for termination signals and unhandled errors to trigger shutdown
['SIGINT', 'SIGTERM'].forEach(signal => {
    process.on(signal, () => shutdown(signal));
});

// Listen for unhandled promise rejections to trigger shutdown
process.on('unhandledRejection', (reason) => {
    logger.error('unhandled rejection:', { tag, reason });
    shutdown('unhandledRejection');
});

// Listen for uncaught exceptions to trigger shutdown
process.on('uncaughtException', (err) => {
    logger.error('uncaught exception:', { tag, err });
    shutdown('uncaughtException');
});

export default { register };