const { grpc, loadChatProto } = require('../lib/grpc');
const ChatState = require('./chatState');
const { createChatService } = require('./chatService');

const chatProto = loadChatProto();

function main() {
    const server = new grpc.Server();
    const state = new ChatState();
    const handlers = createChatService(state);

    server.addService(chatProto.ChatService.service, {
        Chat: handlers.Chat,
        CreateRoom: handlers.CreateRoom,
        Join: handlers.Join,
        SendMessage: handlers.SendMessage,
        ListRooms: handlers.ListRooms,
        GetUsersInRoom: handlers.GetUsersInRoom,
        GetHistory: handlers.GetHistory,
        Health: handlers.Health,
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
