const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

const PROTO_PATH = path.join(__dirname, '..', 'proto', 'user.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
});

const chatProto = grpc.loadPackageDefinition(packageDefinition).chat;

// In-memory list of active streams for broadcasting.
const activeClients = new Map();

function nowIso() {
    return new Date().toISOString();
}

function broadcastMessage(message) {
    for (const { call } of activeClients.values()) {
        call.write(message);
    }
}

function chat(call) {
    const clientId = `client-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const clientInfo = { call, user: 'Anonymous' };
    activeClients.set(clientId, clientInfo);

    call.write({
        user: 'System',
        message: 'Connected to gRPC chat. Type messages and press Enter.',
        timestamp: nowIso(),
        isSystem: true,
    });

    let disconnected = false;

    const disconnectClient = () => {
        if (disconnected) {
            return;
        }

        disconnected = true;
        const userName = clientInfo.user || 'Anonymous';
        activeClients.delete(clientId);

        broadcastMessage({
            user: 'System',
            message: `${userName} left the chat.`,
            timestamp: nowIso(),
            isSystem: true,
        });
    };

    call.on('data', (incomingMessage) => {
        const userName = (incomingMessage.user || '').trim() || 'Anonymous';
        const text = (incomingMessage.message || '').trim();

        if (!text) {
            return;
        }

        // Announce once when a client first identifies with a non-default username.
        if (clientInfo.user === 'Anonymous' && userName !== 'Anonymous') {
            clientInfo.user = userName;
            broadcastMessage({
                user: 'System',
                message: `${userName} joined the chat.`,
                timestamp: nowIso(),
                isSystem: true,
            });
        } else {
            clientInfo.user = userName;
        }

        broadcastMessage({
            user: userName,
            message: text,
            timestamp: nowIso(),
            isSystem: false,
        });
    });

    call.on('end', () => {
        disconnectClient();
        call.end();
    });

    call.on('error', () => {
        disconnectClient();
    });
}

function main() {
    const server = new grpc.Server();

    server.addService(chatProto.ChatService.service, {
        Chat: chat,
    });

    const address = '0.0.0.0:50051';

    server.bindAsync(address, grpc.ServerCredentials.createInsecure(), (error, port) => {
        if (error) {
            console.error('Failed to start gRPC server:', error);
            return;
        }

        console.log(`gRPC server is running on ${address}`);
        console.log(`Bound on port ${port}`);
    });
}

main();
