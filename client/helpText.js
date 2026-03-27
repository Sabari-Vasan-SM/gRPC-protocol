const HELP_TEXT = [
    '',
    'Commands:',
    '  /help                 Show command help',
    '  /join <room>          Join or create a room',
    '  /rooms                List existing rooms',
    '  /users                Show users in current room',
    '  /history [limit]      Show recent room history (default 10)',
    '  /send <message>       Send message to current room',
    '  /exit                 Leave chat',
    '',
].join('\n');

module.exports = {
    HELP_TEXT,
};
