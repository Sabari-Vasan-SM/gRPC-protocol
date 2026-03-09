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

const userProto = grpc.loadPackageDefinition(packageDefinition).user;

// In-memory storage for users (resets when server restarts).
const users = [];

function createUser(call, callback) {
    const { id, name, email } = call.request;

    if (!id || !name || !email) {
        return callback({
            code: grpc.status.INVALID_ARGUMENT,
            details: 'id, name, and email are required.',
        });
    }

    const existingUser = users.find((user) => user.id === id);
    if (existingUser) {
        return callback({
            code: grpc.status.ALREADY_EXISTS,
            details: `User with id ${id} already exists.`,
        });
    }

    users.push({ id, name, email });
    return callback(null, {
        success: true,
        message: `User ${id} created successfully.`,
    });
}

function getUser(call, callback) {
    const { id } = call.request;
    const user = users.find((item) => item.id === id);

    if (!user) {
        return callback({
            code: grpc.status.NOT_FOUND,
            details: `User with id ${id} not found.`,
        });
    }

    return callback(null, user);
}

function listUsers(call, callback) {
    return callback(null, { users });
}

function deleteUser(call, callback) {
    const { id } = call.request;
    const index = users.findIndex((user) => user.id === id);

    if (index === -1) {
        return callback({
            code: grpc.status.NOT_FOUND,
            details: `User with id ${id} not found.`,
        });
    }

    users.splice(index, 1);
    return callback(null, {
        success: true,
        message: `User ${id} deleted successfully.`,
    });
}

function main() {
    const server = new grpc.Server();

    server.addService(userProto.UserService.service, {
        CreateUser: createUser,
        GetUser: getUser,
        ListUsers: listUsers,
        DeleteUser: deleteUser,
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
