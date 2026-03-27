# Realtime Multi-Room Chat Platform using gRPC

A larger, modular gRPC project for realtime chat with room management, message history, and operational RPCs.

## Project Structure

```text
project/
├── lib/
│   └── grpc.js
├── proto/
│   └── user.proto
├── server/
│   ├── chatService.js
│   ├── chatState.js
│   ├── config.js
│   └── server.js
├── client/
│   ├── clientApi.js
│   ├── consoleFormatter.js
│   ├── helpText.js
│   └── client.js
├── package.json
└── README.md
```

## What This Project Does

The gRPC service (`ChatService`) now includes:

- `Chat(stream ChatMessage) returns (stream ChatMessage)` for realtime room-scoped streaming
- `CreateRoom`, `Join`, `SendMessage` unary RPCs for command-like operations
- `ListRooms`, `GetUsersInRoom` unary RPCs for discovery and presence
- `GetHistory` server-streaming RPC for recent messages
- `Health` unary RPC for readiness/health checks

Each connected client can:

- Join and switch chat rooms
- Send messages to the active room
- Receive realtime broadcasts only for room participants
- List rooms and users in the current room
- Fetch recent message history for the current room
- Exit gracefully

State is in-memory (rooms, users, history), so data resets when the server restarts.

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
- Type `/help` for commands

### Client Commands

```text
/help                 Show command help
/join <room>          Join or create a room
/rooms                List existing rooms
/users                Show users in current room
/history [limit]      Show recent room history (default 10)
/send <message>       Send message explicitly
/exit                 Leave chat
```

## How gRPC Works Here (Brief)

1. The API contract is defined in `proto/user.proto`.
2. Shared loading logic in `lib/grpc.js` ensures client/server contract consistency.
3. The server tracks rooms, users, active streams, and bounded room history in memory.
4. Realtime messages flow through a bidirectional stream and are broadcast per-room.
5. Management queries and operations use unary and server-streaming RPC endpoints.

## Notes for Beginners

- `.proto` remains the single source of truth for service contracts.
- Combining streaming + unary RPCs enables richer workflows than chat-only demos.
- Next production steps: auth, persistence, retry policies, and distributed state.
