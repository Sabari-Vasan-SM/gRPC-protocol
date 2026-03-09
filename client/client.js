const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const readline = require('readline');

const PROTO_PATH = path.join(__dirname, '..', 'proto', 'user.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
});

const chatProto = grpc.loadPackageDefinition(packageDefinition).chat;

const client = new chatProto.ChatService(
    'localhost:50051',
    grpc.credentials.createInsecure()
);

const userName = process.argv[2] || `User-${Math.floor(Math.random() * 1000)}`;
const stream = client.Chat();
let isShuttingDown = false;

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

console.log(`Connected as ${userName}`);
console.log('Type a message and press Enter. Type /exit to leave.');

stream.on('data', (chatMessage) => {
    const time = chatMessage.timestamp || new Date().toISOString();
    if (chatMessage.isSystem) {
        console.log(`[${time}] [SYSTEM] ${chatMessage.message}`);
        return;
    }

    console.log(`[${time}] ${chatMessage.user}: ${chatMessage.message}`);
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

    if (text.toLowerCase() === '/exit') {
        shutdown();
        return;
    }

    stream.write({
        user: userName,
        message: text,
        timestamp: new Date().toISOString(),
        isSystem: false,
    });
});

process.on('SIGINT', () => {
    shutdown();
    process.exit(0);
});

process.on('SIGTERM', () => {
    shutdown();
    process.exit(0);
});
