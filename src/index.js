import logger, { loggerCloud } from './logger.js';
import expressLogger, { expressLoggerCloud } from './express/logger.js';
import notifier from './notifier.js';
import connect from './moongoose/connection-manager.js';
import salesforcePlugin from './moongoose/plugin/salesforce.js';
import apiMiddleware from './express/api-middleware.js';
import routeHandler from './express/route-handler.js';
import gracefulShutdown from './graceful-shutdown.js';
import createAutoloader from './create-autoloader.js';

const express = {
    logger: expressLogger,
    loggerCloud: expressLoggerCloud,
    routeHandler,
    apiMiddleware
};
const mongoose = {
    connect,
    salesforcePlugin
}

export { gracefulShutdown, logger, loggerCloud, notifier, mongoose, express, createAutoloader };

export default {
    gracefulShutdown,
    logger,
    loggerCloud,
    notifier,
    mongoose,
    express,
    createAutoloader
};
