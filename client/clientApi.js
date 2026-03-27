const { grpc, loadChatProto } = require('../lib/grpc');

function createClient(address = 'localhost:50051') {
    const chatProto = loadChatProto();

    return new chatProto.ChatService(
        address,
        grpc.credentials.createInsecure()
    );
}

function unary(client, method, payload = {}) {
    return new Promise((resolve, reject) => {
        client[method](payload, (error, response) => {
            if (error) {
                reject(error);
                return;
            }

            resolve(response);
        });
    });
}

module.exports = {
    createClient,
    unary,
};
