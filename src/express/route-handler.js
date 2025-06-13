import apiMiddleware from './api-middleware.js';
import logger from '../logger.js';

const tag = 'routeHandler';

const config = {
    expressInstance: null,
    locale: 'en'
};

/**
 * Returns a contextualized logger for the given route/controller.
 * @param {{ name: string }} context - Context object with route name.
 * @returns {{ debug: Function, info: Function, error: Function }} Logger functions with context.
 */
const contextualizedLogger = context => ({
    debug: (message, payload = {}) => logger.debug(message, { tag: context.name, payload }),
    info: (message, payload = {}) => logger.info(message, { tag: context.name, payload }),
    error: (message, payload = {}) => logger.error(message, { tag: context.name, payload})
});

/**
 * Initializes the route handler by injecting express instance and default locale.
 * Automatically attaches the apiMiddleware.
 *
 * @param {import('express').Express} expressInstance - Express application instance.
 * @param {string} [locale=config.locale] - Optional locale string.
 */
const init = (expressInstance, locale = config.locale ) => {
    config.expressInstance = expressInstance;
    config.locale = locale;
    config.expressInstance.use(apiMiddleware);
}

/**
 * Factory to create a route controller builder for a specific route name.
 * Provides a fluent API to register routes, middlewares, methods and handlers.
 *
 * @param {string} name - The name of the controller (for logging/context).
 * @returns {{
 *   setMethod: (method: string) => any,
 *   setRoute: (route: string) => any,
 *   setMiddlewares: (middlewares: import('express').RequestHandler | import('express').RequestHandler[]) => any,
 *   controller: (controllerFn: (req: import('express').Request, res: import('express').Response, logger: any) => Promise<void>) => void
 * }}
 */
const routeController = (name) => {
    const state = {
        name,
        method: 'get',
        route: null,
        middlewares: [],
        controllerFn: () => { res.send() }
    };
    const api = {
        /**
         * Sets the HTTP method for the route.
         * @param {string} method - HTTP method (get, post, put, delete, etc).
         * @returns {}
         */
        setMethod(method) {
            state.method = method;
            return api;
        },

        /**
         * Sets the route path.
         * @param {string} route - Express route path.
         * @returns {typeof api}
         */
        setRoute(route) {
            state.route = route;
            return api;
        },

        /**
         * Sets one or more Express middlewares.
         * @param {import('express').RequestHandler[]|import('express').RequestHandler} middlewares - Middleware(s) to apply.
         * @returns {typeof api}
         */
        setMiddlewares(middlewares) {
            state.middlewares = Array.isArray(middlewares) ? middlewares : [middlewares];
            return api;
        },

        /**
         * Registers the final controller function to handle requests.
         * The controller receives req, res, and a contextualized logger.
         *
         * @param {(req: import('express').Request, res: import('express').Response, logger: any) => Promise<void>} controllerFn - Async controller function.
         * @throws {Error} Throws if express instance or route is missing.
         * @returns {void}
         */
        controller (controllerFn) {
            if (!config.expressInstance) throw new Error('express instance is required');
            if (!state.route) throw new Error('express route not defined');
            const logger = contextualizedLogger(state);
            const ctrl = async function (req, res ) {
                try {
                    logger.debug('new request', { method: state.method, route: state.route, query: req.query, body: req.body });
                    await controllerFn(req, res, logger);
                } catch (err) {
                    return res.apiErrorResponse(err,state.name);
                }
            }
            config.expressInstance[state.method](state.route, ...state.middlewares, ctrl);
        }
    }
    return api;
}

export default {
    init, routeController
}