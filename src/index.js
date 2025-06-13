import logger from './logger.js';
import expressLogger from './express/logger.js';
import notifier from './notifier.js';
import connect from './moongoose/connection-manager.js';
import salesforcePlugin from './moongoose/plugin/salesforce.js';
import apiMiddleware from './express/api-middleware.js';
import routeHandler from './express/route-handler.js';
import gracefulShutdown from './graceful-shutdown.js';

const express = {
    logger: expressLogger,
    routeHandler,
    apiMiddleware
};
const mongoose = {
    connect,
    salesforcePlugin
}

export { gracefulShutdown, logger, notifier, mongoose, express };

export default {
    gracefulShutdown,
    logger,
    notifier,
    mongoose,
    express
};