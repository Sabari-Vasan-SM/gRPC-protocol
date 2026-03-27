function formatMessage(chatMessage) {
    const time = chatMessage.timestamp || new Date().toISOString();
    const room = chatMessage.room || 'lobby';

    if (chatMessage.isSystem) {
        return `[${time}] [${room}] [SYSTEM] ${chatMessage.message}`;
    }

    return `[${time}] [${room}] ${chatMessage.user}: ${chatMessage.message}`;
}

module.exports = {
    formatMessage,
};
