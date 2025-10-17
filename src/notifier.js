import axios from 'axios';
import logger from './logger.js'

const tag = 'notifier';

const options = {
    botOauthToken: '',
    channel: '',
    isInit: false
}

const init = (environment, botOauthToken, channel = '#general') => {
    options.environment = environment;
    options.botOauthToken = botOauthToken;
    options.channel = channel;
    options.isInit = true;
};

const getLevelColor = (level) => {
    switch (level) {
        case "low":
            return "#007BFF";
        case "medium":
            return "#FFD700";
        case "high":
        default:
            return "#FF4C4C";
    }
};

const getLevelEmoji = (level) => {
    switch (level) {
        case "low":
            return "ℹ️";
        case "medium":
            return "⚠️";
        case "high":
        default:
            return "🔥";
    }
};

const send = async function (text, attachment = null, level = 'low', channel = null) {

    if(!options.isInit)
        return logger.error('slack notifer not initialized!', { tag });

    const payload = {
        channel: channel || options.channel,
        attachments: [
            {
                color: getLevelColor(level),
                blocks: [
                    // HEADER: environment
                    {
                        type: "header",
                        text: {
                            type: "plain_text",
                            text: `${options.environment}`,
                        },
                    },
                    // SECTION: level emo text
                    {
                        type: "section",
                        text: {
                            type: "mrkdwn",
                            text: `${getLevelEmoji(level)} ${text}`,
                        },
                    },
                ],
            },
        ],
    };

    if (attachment) {
        payload.attachments[0].blocks.push({
            type: "section",
            text: {
                type: "mrkdwn",
                text: '```' + JSON.stringify(attachment, null, 2) + '```',
            },
        });
    }

    try {
        await axios.post('https://slack.com/api/chat.postMessage',
            payload,
            {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${options.botOauthToken}`,
                },
            }
        );
        logger.info('slack notification send', { tag, text });
    } catch (err) {
        logger.error('slack notification fail', { tag, text, err });
    }
    return;

};

export default { init, send };