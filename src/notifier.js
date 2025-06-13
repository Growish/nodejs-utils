import axios from 'axios';
import logger from './logger.js'

const tag = 'notifier';

const options = {
    enviroment: '',
    slackHookBaseUrl: '',
    isInit: false
}

const init = (enviroment, slackHookBaseUrl) => {
    options.enviroment = enviroment;
    options.slackHookBaseUrl = slackHookBaseUrl;
    options.isInit = true;
};

const send = async function (text, attachment = null, level = 'low', channel = null) {

    if(!options.isInit)
        return logger.error('slack notifer not initialized!', { tag });

    const payload = {
        username: 'GWP(' + options.enviroment + ')',
        mrkdwn: true,
        text
    };

    if(attachment) {
        payload.attachments = [{
            title: "Attachment",
            text: '```' + JSON.stringify(attachment, null, 2) + '```',
            mrkdwn_in: true,
            color: level === 'low' ? '#7CD197' : level === 'medium' ? '#d1b42a' : '#d1401c'
        }];
    }

    if(channel)
        payload.channel = channel;

    try {
        await axios.post(options.slackHookBaseUrl, payload);
        logger.info('slack notification send', { tag, text });
    } catch (err) {
        logger.error('slack notification fail', { tag, text, err });
    }
    return;

};

export default { init, send };