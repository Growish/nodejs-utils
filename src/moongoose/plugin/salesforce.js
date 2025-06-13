import logger from '../../logger.js';

const tag = 'saleforceMongoosePlugin';

const config = {
    isInit: false,
    pushFn: () => { logger.info('pushFn called', { tag }); },
    deleteFn: () => { logger.info('deleteFn called', { tag });},
    realTimeSyncActive: false,
    ignorePushAfterSave: false
};

/**
 * Initializes the Salesforce mongoose plugin.
 * @param {boolean} [realTimeSyncActive=config.realTimeSyncActive] - Enable real-time sync.
 * @param {function} [pushFn=config.pushFn] - Function to handle push events.
 * @param {function} [deleteFn=config.deleteFn] - Function to handle delete events.
 * @param {boolean} [ignorePushAfterSave=config.ignorePushAfterSave] - Ignore push after save.
 */
const init = (
    realTimeSyncActive =
        config.realTimeSyncActive,
    pushFn = config.pushFn,
    deleteFn = config.deleteFn,
    ignorePushAfterSave = config.ignorePushAfterSave
) => {
    config.isInit = true;
    config.realTimeSyncActive = realTimeSyncActive;
    config.pushFn = pushFn;
    config.deleteFn = deleteFn;
    config.ignorePushAfterSave = ignorePushAfterSave;
}

/**
 * Mongoose plugin to integrate Salesforce synchronization.
 * @param {import('mongoose').Schema} schema - The Mongoose schema to enhance.
 * @param {Object} [options={}] - Plugin options.
 * @param {boolean} [options.addSchema] - Whether to add Salesforce sync schema fields.
 * @param {string} [options.assetClass] - Asset class identifier used in push/delete functions.
 */
const mongoosePlugin = (schema, options = {}) => {

    if (options.addSchema) {
        schema.add({
            salesforce: {
                sync: {
                    type: Boolean,
                    enum: [false, true],
                    default: false
                },
                lastSyncAt: {
                    type: Date
                }

            }
        });
    }

    schema.post('save', function (doc, next) {

        try {
            if (!config.isInit) {
                logger.error('Salesforce sync needs to be initialized!', { tag });
                return next();
            }

            if (!config.realTimeSyncActive)
                return next();

            if(config.ignorePushAfterSave)
                return next();

            pushFn({assetId: doc._id, assetClass: options.assetClass, hook: 'save'});
            next();
        }
        catch (e) {
            logger.error('post save hook failed', { tag });
            next();
        }

    });

    /**
     * Push document to Salesforce.
     * @param {boolean} [force=false] - Force push even if real-time sync is inactive.
     * @returns {Promise<boolean|any>} Result of the push function or false on failure.
     */
    schema.methods.pushToSalesforce = async function (force = false) {

        if(!config.isInit) {
            logger.error('Salesforce plugin needs to be initialized!', { tag });
            return false;
        }

        if(!realTimeSyncActive && !force)
            return false;

        try {
            return await pushFn({assetId: this._id, assetClass: options.assetClass, hook: 'direct'});
        } catch (err) {
            logger.error('push to salesforce failed', { tag, err });
            return false;
        }
    };

    /**
     * Delete this document from Salesforce.
     * @returns {Promise<boolean|any>} Result of the delete function or false on failure.
     */
    schema.methods.deleteFromSalesforce = async function () {
        if(!config.isInit) {
            logger.error('Salesforce plugin needs to be initialized!', { tag });
            return false;
        }

        if(!config.realTimeSyncActive)
            return false;
        try {
            return await deleteFn({assetId: this._id, assetClass: options.assetClass, hook: 'direct'});
        } catch (err) {
            logger.error('delete from salesforce failed', { tag, err });
            return false;
        }
    }

};

export default {
    init, mongoosePlugin
}