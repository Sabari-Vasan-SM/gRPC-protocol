const readline = require('readline');
const { DEFAULT_ROOM } = require('../server/config');
const { createClient, unary } = require('./clientApi');
const { formatMessage } = require('./consoleFormatter');
const { HELP_TEXT } = require('./helpText');

const client = createClient('localhost:50051');

const userName = process.argv[2] || `User-${Math.floor(Math.random() * 1000)}`;
const stream = client.Chat();
let isShuttingDown = false;
let currentRoom = DEFAULT_ROOM;

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

function shutdown() {
    if (isShuttingDown) {
        return;
    }

    isShuttingDown = true;
    stream.end();
    rl.close();
    client.close();
}

async function joinRoom(roomName) {
    const room = (roomName || '').trim().toLowerCase();
    if (!room) {
        console.log('Usage: /join <room>');
        return;
    }

    const response = await unary(client, 'Join', {
        user: userName,
        room,
    });

    if (!response.ok) {
        console.log(`Join failed: ${response.message}`);
        return;
    }

    currentRoom = room;
    console.log(`[${response.timestamp}] ${response.message}`);
}

async function send(text) {
    stream.write({
        id: '',
        user: userName,
        room: currentRoom,
        message: text,
        timestamp: new Date().toISOString(),
        isSystem: false,
    });
}

async function showRooms() {
    const response = await unary(client, 'ListRooms', {});
    console.log(`Rooms: ${response.rooms.join(', ') || '(none)'}`);
}

async function showUsers() {
    const response = await unary(client, 'GetUsersInRoom', {
        name: currentRoom,
    });
    console.log(`Users in ${currentRoom}: ${response.users.join(', ') || '(none)'}`);
}

async function showHistory(limitArg) {
    const parsed = Number(limitArg);
    const limit = Number.isFinite(parsed) && parsed > 0 ? parsed : 10;

    const historyStream = client.GetHistory({
        room: currentRoom,
        limit,
    });

    console.log(`Recent messages in ${currentRoom}:`);
    historyStream.on('data', (message) => {
        console.log(formatMessage(message));
    });

    await new Promise((resolve, reject) => {
        historyStream.on('end', resolve);
        historyStream.on('error', reject);
    });
}

async function handleCommand(rawLine) {
    const [command, ...args] = rawLine.trim().split(' ');

    switch ((command || '').toLowerCase()) {
        case '/help':
            console.log(HELP_TEXT);
            break;
        case '/join':
            await joinRoom(args[0]);
            break;
        case '/rooms':
            await showRooms();
            break;
        case '/users':
            await showUsers();
            break;
        case '/history':
            await showHistory(args[0]);
            break;
        case '/send':
            await send(args.join(' ').trim());
            break;
        case '/exit':
            shutdown();
            break;
        default:
            console.log('Unknown command. Type /help for available commands.');
    }
}

console.log(`Connected as ${userName}`);
console.log(`Current room: ${currentRoom}`);
console.log('Type a message and press Enter. Type /help for commands.');

stream.on('data', (chatMessage) => {
    console.log(formatMessage(chatMessage));
});

stream.on('error', (error) => {
    if (isShuttingDown) {
        return;
    }

    console.error('Stream error:', error.message);
    shutdown();
});

stream.on('end', () => {
    console.log('Disconnected from chat server.');
    shutdown();
});

rl.on('line', (line) => {
    const text = line.trim();

    if (!text) {
        return;
    }

    if (text.startsWith('/')) {
        handleCommand(text).catch((error) => {
            console.error('Command failed:', error.message);
        });
        return;
    }

    send(text).catch((error) => {
        console.error('Send failed:', error.message);
    });
});

joinRoom(currentRoom).catch((error) => {
    console.error('Initial join failed:', error.message);
});

process.on('SIGINT', () => {
    shutdown();
    process.exit(0);
});

process.on('SIGTERM', () => {
    shutdown();
    process.exit(0);
});
