const { DEFAULT_ROOM } = require('./config');
const { nowIso, generateId } = require('./utils');

function createAck(ok, message) {
    return {
        ok,
        message,
        timestamp: nowIso(),
    };
}

function createChatMessage({ user, room, message, isSystem = false }) {
    return {
        id: generateId('msg'),
        user,
        room,
        message,
        timestamp: nowIso(),
        isSystem,
    };
}

function createChatService(state) {
    function broadcastToRoom(roomName, chatMessage) {
        state.forEachClientInRoom(roomName, (_clientId, client) => {
            client.call.write(chatMessage);
        });

        state.appendHistory(chatMessage);
    }

    function chat(call) {
        const clientId = generateId('client');
        state.addClient(clientId, call);

        call.write(createChatMessage({
            user: 'System',
            room: DEFAULT_ROOM,
            message: 'Connected. Use /join <room> in the client to switch rooms.',
            isSystem: true,
        }));

        let disconnected = false;

        const disconnectClient = () => {
            if (disconnected) {
                return;
            }

            disconnected = true;
            const removedClient = state.removeClient(clientId);
            if (!removedClient) {
                return;
            }

            const leaveMessage = createChatMessage({
                user: 'System',
                room: removedClient.room,
                message: `${removedClient.user} left room ${removedClient.room}.`,
                isSystem: true,
            });

            broadcastToRoom(removedClient.room, leaveMessage);
        };

        call.on('data', (incomingMessage) => {
            const userName = (incomingMessage.user || '').trim() || 'Anonymous';
            const roomName = state.ensureRoom((incomingMessage.room || '').trim() || DEFAULT_ROOM);
            const text = (incomingMessage.message || '').trim();

            if (!text) {
                return;
            }

            const previousClient = state.getClient(clientId);
            const oldRoom = previousClient ? previousClient.room : roomName;
            state.setClientIdentity(clientId, userName, roomName);

            if (oldRoom !== roomName) {
                const roomChange = createChatMessage({
                    user: 'System',
                    room: roomName,
                    message: `${userName} joined room ${roomName}.`,
                    isSystem: true,
                });
                broadcastToRoom(roomName, roomChange);
            }

            const outbound = createChatMessage({
                user: userName,
                room: roomName,
                message: text,
                isSystem: false,
            });

            broadcastToRoom(roomName, outbound);
        });

        call.on('end', () => {
            disconnectClient();
            call.end();
        });

        call.on('error', () => {
            disconnectClient();
        });
    }

    function createRoom(call, callback) {
        const roomName = state.ensureRoom(call.request.name);
        callback(null, createAck(true, `Room '${roomName}' is available.`));
    }

    function join(call, callback) {
        const userName = (call.request.user || '').trim() || 'Anonymous';
        const roomName = state.joinRoom(userName, call.request.room || DEFAULT_ROOM);
        callback(null, createAck(true, `${userName} joined room '${roomName}'.`));
    }

    function sendMessage(call, callback) {
        const userName = (call.request.user || '').trim() || 'Anonymous';
        const roomName = state.ensureRoom(call.request.room || DEFAULT_ROOM);
        const text = (call.request.message || '').trim();

        if (!text) {
            callback(null, createAck(false, 'message is required'));
            return;
        }

        const outbound = createChatMessage({
            user: userName,
            room: roomName,
            message: text,
            isSystem: false,
        });

        broadcastToRoom(roomName, outbound);
        callback(null, createAck(true, 'message delivered'));
    }

    function listRooms(_call, callback) {
        callback(null, { rooms: state.listRooms() });
    }

    function getUsersInRoom(call, callback) {
        const roomName = state.ensureRoom(call.request.name || DEFAULT_ROOM);
        callback(null, {
            room: roomName,
            users: state.usersInRoom(roomName),
        });
    }

    function getHistory(call) {
        const roomName = state.ensureRoom(call.request.room || DEFAULT_ROOM);
        const history = state.getHistory(roomName, call.request.limit || 20);

        for (const message of history) {
            call.write(message);
        }

        call.end();
    }

    function health(_call, callback) {
        callback(null, createAck(true, 'chat service healthy'));
    }

    return {
        Chat: chat,
        CreateRoom: createRoom,
        Join: join,
        SendMessage: sendMessage,
        ListRooms: listRooms,
        GetUsersInRoom: getUsersInRoom,
        GetHistory: getHistory,
        Health: health,
    };
}

module.exports = {
    createChatService,
};
