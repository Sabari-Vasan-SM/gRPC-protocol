# User Management System using gRPC

A beginner-friendly mini project to learn how gRPC works with Node.js and Protocol Buffers.

## Project Structure

```text
project/
├── proto/
│   └── user.proto
├── server/
│   └── server.js
├── client/
│   └── client.js
├── package.json
└── README.md
```

## What This Project Does

The gRPC service (`UserService`) supports these methods:

- `CreateUser`
- `GetUser`
- `ListUsers`
- `DeleteUser`

Users are stored in an in-memory array on the server, so data is reset when the server restarts.

## Installation

1. Open a terminal in the project root.
2. Install dependencies:

```bash
npm install
```

## Run the Project

### 1. Start the gRPC server

```bash
npm run start:server
```

The server starts on `localhost:50051`.

### 2. Run the client (in another terminal)

```bash
npm run start:client
```

The client will:

- Create two users
- List all users
- Get one user by id
- Delete one user
- List users again

## How gRPC Works Here (Brief)

1. The API contract is defined in `proto/user.proto`.
2. Server and client both load this `.proto` file using `@grpc/proto-loader`.
3. The server implements each RPC method in `server/server.js`.
4. The client calls those methods in `client/client.js` as if they were local functions.
5. gRPC handles serialization (Protocol Buffers), network transport (HTTP/2), and method routing.

## Notes for Beginners

- `.proto` is the single source of truth for your service contract.
- Both server and client must follow the same contract.
- In real projects, replace in-memory storage with a database.
