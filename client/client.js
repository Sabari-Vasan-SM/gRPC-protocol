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

const client = new userProto.UserService(
    'localhost:50051',
    grpc.credentials.createInsecure()
);

// Converts callback-based gRPC methods into promises for cleaner flow.
function unaryCall(method, request) {
    return new Promise((resolve, reject) => {
        method.call(client, request, (error, response) => {
            if (error) {
                return reject(error);
            }
            return resolve(response);
        });
    });
}

async function runDemo() {
    try {
        console.log('--- CreateUser ---');
        const create1 = await unaryCall(client.CreateUser, {
            id: '1',
            name: 'Alice',
            email: 'alice@example.com',
        });
        console.log(create1);

        const create2 = await unaryCall(client.CreateUser, {
            id: '2',
            name: 'Bob',
            email: 'bob@example.com',
        });
        console.log(create2);

        console.log('\n--- ListUsers ---');
        const usersBeforeDelete = await unaryCall(client.ListUsers, {});
        console.log(usersBeforeDelete);

        console.log('\n--- GetUser (id=1) ---');
        const user = await unaryCall(client.GetUser, { id: '1' });
        console.log(user);

        console.log('\n--- DeleteUser (id=2) ---');
        const deleteResult = await unaryCall(client.DeleteUser, { id: '2' });
        console.log(deleteResult);

        console.log('\n--- ListUsers (after delete) ---');
        const usersAfterDelete = await unaryCall(client.ListUsers, {});
        console.log(usersAfterDelete);
    } catch (error) {
        console.error('gRPC error:', {
            code: error.code,
            details: error.details,
            message: error.message,
        });
    } finally {
        client.close();
    }
}

runDemo();
