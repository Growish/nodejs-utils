import logger from '../logger.js';

/**
 * Converts an array of objects into a CSV string.
 * The first row contains the object keys as headers.
 * @param {Object[]} arr - Array of objects to convert.
 * @returns {string} CSV formatted string.
 */
const convertToCSV = (arr) => {
    const array = [Object.keys(arr[0])].concat(arr);
    return array.map(it => {
        return Object.values(it).toString();
    }).join('\n');
}

/**
 * Extracts the raw data from an object, calling `getPublicFields` or `toJSON` if available,
 * and removes internal versioning fields.
 * @param {*} data - Data object to extract.
 * @returns {*} Extracted plain data.
 */
const extractData = (data) => {
    if(data && typeof data.getPublicFields === 'function')
        data = data.getPublicFields();

    if(data && typeof data.toJSON === 'function')
        data = data.toJSON();

    if(data && typeof data === 'object') {
        delete data.__v;
    }

    return data;
}

/**
 * Express middleware for standardized API response formatting and error handling.
 * Adds helper methods to the response object to send various HTTP responses with consistent JSON structure.
 *
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware function.
 */
const apiMiddleware = (req, res, next) => {

    let pagination = null;

    /**
     * Helper to send standardized JSON response.
     * @param {number} code - HTTP status code.
     * @param {*} [payload={}] - Data payload for response.
     * @param {string} [message=''] - Optional message.
     * @returns {import('express').Response} Express response.
     */
    function getResponse (code, payload = {}, message = '') {

        console.log(payload);
        const response = {
            code
        };
        if (Array.isArray(payload))
            payload = payload.map(row => extractData(row));
        else
            payload = extractData(payload)
        if(payload)
            response.data = payload;
        if(message)
            response.message = message;
        if(pagination)
            response.pagination = pagination;
        response.requestTime = (new Date().getTime() - req.locals.requestStart) + "ms";
        return res.status(code).json(response);
    }



    if(!req.locals)
        req.locals = {enrich: {}};

    req.locals.requestStart = new Date().getTime();

    res.errorConstants = {
        MISSING_EMAIL_CONFIRMATION: 100,
        MISSING_PHONE_NUMBER_FOR_SMS_OTP: 101,
        INVALID_SMS_OTP: 102,
        SMS_OTP_SENT: 103
    };

    /**
     * Sets pagination metadata to be included in response.
     * @param {Object} p - Pagination info object.
     * @returns {import('express').Response} The response object for chaining.
     */
    res.setPagination = (p) => {
        pagination = p;
        return res;
    };

    /**
     * Sends 200 OK with payload.
     * @param {*} payload - Data payload.
     * @returns {import('express').Response}
     */
    res.resolve = (payload) => getResponse(200, payload);

    /**
     * Sends CSV response with provided payload array.
     * @param {Object[]} payload - Array of objects to convert to CSV.
     * @returns {import('express').Response}
     */
    res.csv = (payload) => {
        res.header('Content-Type', 'text/csv');
        res.attachment('export.csv');
        return res.send(convertToCSV(payload));
    };

    /**
     * Sends 400 Bad Request with optional payload.
     * @param {*} payload
     * @returns {import('express').Response}
     */
    res.badRequest = (payload) => getResponse(400, payload);

    /**
     * Sends 401 Unauthorized with optional message.
     * @param {string} [message]
     * @returns {import('express').Response}
     */
    res.unauthorized = (message) => getResponse(401, null, message);

    /**
     * Sends 403 Forbidden with optional message.
     * @param {string} [message]
     * @param {*} payload
     * @returns {import('express').Response}
     */
    res.forbidden = (message, payload) => getResponse(403, payload, message);

    /**
     * Sends 409 Conflict with reason and message.
     * @param {string} reason
     * @param {string} [message]
     * @returns {import('express').Response}
     */
    res.conflict = (reason, message) => getResponse(409, { reason }, message);

    /**
     * Sends 404 Not Found.
     * @returns {import('express').Response}
     */
    res.notFound = () => getResponse(404, null, null);

    /**
     * Sends 500 Internal Server Error with optional message.
     * @param {string} [message]
     * @returns {import('express').Response}
     */
    res.applicationError = (message = null) => getResponse(500, null, message);

    /**
     * Sends 429 Too Many Requests with optional message.
     * @param {string} [message]
     * @returns {import('express').Response}
     */
    res.tooManyRequests = (message) => getResponse(429, null, message);

    /**
     * Sends 408 Request Timeout with optional message.
     * @param {string} [message]
     * @returns {import('express').Response}
     */
    res.timeout = (message) => getResponse(408, null, message);

    /**
     * Sends 503 Service Unavailable with optional message.
     * @param {string} [message]
     * @returns {import('express').Response}
     */
    res.unavailable = (message) => getResponse(503, null, message);

    /**
     * Sends 200 OK with custom aggregation payload (no wrapping).
     * @param {Object} payload
     * @returns {import('express').Response}
     */
    res.aggregationResolve = (payload) => { return res.status(200).json({code: 200, ...payload}); };

    /**
     * Sends an API error response based on error type.
     * @param {Error} err
     * @param {string} controllerName
     * @returns {import('express').Response}
     */
    res.apiErrorResponse = (err, controllerName) => {

        if(err && err.name === 'ValidationError')
            return getResponse(400, err.data);

        if(err && err.name === 'ForbiddenError')
            return getResponse(403, null, err.message);

        if (err && err.name === 'ConflictError')
            return getResponse(409, { reason: err.reason });

        logger.error("request error", { tag: controllerName, err });
        return getResponse(500, null, null);

    };

    next();
};

export default apiMiddleware;