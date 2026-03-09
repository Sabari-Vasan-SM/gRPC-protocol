# Realtime Chat Application using gRPC

A beginner-friendly mini project to learn realtime communication with gRPC, Node.js, and Protocol Buffers.

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

The gRPC service (`ChatService`) uses one bidirectional streaming RPC:

- `Chat(stream ChatMessage) returns (stream ChatMessage)`

Each connected client can:

- Send messages to the server
- Receive broadcast messages from all users in realtime
- Join and leave the chat

Active connections are kept in memory, so everything resets when the server restarts.

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

### 2. Run one or more chat clients (in other terminals)

```bash
npm run start:client -- Alice
npm run start:client -- Bob
```

Each client terminal is interactive:

- Type a message and press Enter to send
- Type `/exit` to leave chat

## How gRPC Works Here (Brief)

1. The API contract is defined in `proto/user.proto`.
2. Server and client both load this `.proto` file using `@grpc/proto-loader`.
3. The server opens one stream per connected client and stores active streams in memory.
4. When a client sends a message, the server broadcasts it to every active stream.
5. gRPC handles serialization (Protocol Buffers), network transport (HTTP/2), and stream delivery.

## Notes for Beginners

- `.proto` is the single source of truth for your service contract.
- Bidirectional streaming is great for chat, live feeds, and collaborative apps.
- In production, add authentication, persistence, and message history storage.
