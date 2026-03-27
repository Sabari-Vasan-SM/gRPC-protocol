const { CHAT_HISTORY_LIMIT, DEFAULT_ROOM } = require('./config');

class ChatState {
    constructor() {
        this.rooms = new Map();
        this.activeClients = new Map();
        this.ensureRoom(DEFAULT_ROOM);
    }

    ensureRoom(roomName) {
        const normalizedRoom = (roomName || '').trim().toLowerCase() || DEFAULT_ROOM;

        if (!this.rooms.has(normalizedRoom)) {
            this.rooms.set(normalizedRoom, {
                users: new Set(),
                history: [],
            });
        }

        return normalizedRoom;
    }

    addClient(clientId, call) {
        this.activeClients.set(clientId, {
            call,
            user: 'Anonymous',
            room: DEFAULT_ROOM,
        });
    }

    removeClient(clientId) {
        const client = this.activeClients.get(clientId);
        if (!client) {
            return null;
        }

        this.activeClients.delete(clientId);
        this.leaveRoom(client.user, client.room);
        return client;
    }

    joinRoom(userName, roomName) {
        const room = this.ensureRoom(roomName);
        this.rooms.get(room).users.add(userName);
        return room;
    }

    leaveRoom(userName, roomName) {
        const room = this.rooms.get(roomName);
        if (!room) {
            return;
        }

        room.users.delete(userName);
    }

    setClientIdentity(clientId, userName, roomName) {
        const client = this.activeClients.get(clientId);
        if (!client) {
            return null;
        }

        this.leaveRoom(client.user, client.room);

        client.user = userName;
        client.room = this.joinRoom(userName, roomName);

        return client;
    }

    getClient(clientId) {
        return this.activeClients.get(clientId);
    }

    listRooms() {
        return Array.from(this.rooms.keys()).sort();
    }

    usersInRoom(roomName) {
        const room = this.rooms.get(roomName);
        if (!room) {
            return [];
        }

        return Array.from(room.users).sort();
    }

    appendHistory(message) {
        const room = this.rooms.get(message.room);
        if (!room) {
            return;
        }

        room.history.push(message);
        if (room.history.length > CHAT_HISTORY_LIMIT) {
            room.history.shift();
        }
    }

    getHistory(roomName, limit) {
        const room = this.rooms.get(roomName);
        if (!room) {
            return [];
        }

        const safeLimit = Math.max(1, Math.min(Number(limit) || 20, CHAT_HISTORY_LIMIT));
        return room.history.slice(-safeLimit);
    }

    forEachClientInRoom(roomName, callback) {
        for (const [clientId, client] of this.activeClients.entries()) {
            if (client.room === roomName) {
                callback(clientId, client);
            }
        }
    }
}

module.exports = ChatState;
