# Appointment Slots API

A small Fastify-based HTTP API for managing appointment time slots (listing, creating, booking and deleting slots) written in TypeScript.  
Slots are stored in memory and seeded with a few example entries, which makes this project useful for katas, demos, or as a starting point for a more complete service.

## Features

- List slots with optional date range and booking state filters.
- Create new slots with validation (15, 30, or 60 minutes; no overlaps).
- Book a slot by email with basic email validation.
- Delete unbooked slots.
- Query 30‑minute availability windows between two timestamps.
- Type-safe schemas using TypeBox and Fastify's type provider.
- Tests using `node:test` and Fastify's `inject` API.
- Linting and formatting via Biome.
- Dockerfile and GitHub Actions workflow included.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 22.x (see `.nvmrc`)
- [npm](https://www.npmjs.com/)
- [Docker](https://www.docker.com/) (optional, for containerized deployment)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/lems111/appointment-slots.git
   cd appointment-slots
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Configure environment variables:

   ```bash
   cp .env.example .env
   ```

   Then adjust values as needed, for example:

   - `PORT` – HTTP port for the API (default `3000`).
   - `LOG_LEVEL` – optional Fastify/Pino log level (`debug`, `info`, etc.).

### Development

Start the development server with hot reloading:

```bash
npm run dev
```

By default the API is available at `http://localhost:3000` (or the port set in `PORT`).

## API Overview

All endpoints accept and return JSON. Timestamps are ISO 8601 strings in UTC.

- `GET /slots`  
  List slots, optionally filtered.
  - Query parameters:
    - `from` (optional, string, date-time) – minimum start time.
    - `to` (optional, string, date-time) – maximum start time.
    - `booked` (optional, boolean) – filter on booking state.
  - Response: `200 OK` with an array of slots sorted by `start`.

- `POST /slots`  
  Create a new slot.
  - Request body:
    - `start` (string, date-time)
    - `end` (string, date-time)
  - Rules:
    - `start` must be before `end`.
    - Duration must be exactly 15, 30, or 60 minutes.
    - Slot must not overlap any existing slot.
  - Responses:
    - `201 Created` with the created slot.
    - `400 Bad Request` on validation errors.

- `POST /slots/:id/book`  
  Book an existing slot.
  - Request body:
    - `email` (string, email)
  - Responses:
    - `200 OK` with the booked slot.
    - `400 Bad Request` for invalid email.
    - `404 Not Found` if the slot does not exist.
    - `409 Conflict` if the slot is already booked.

- `DELETE /slots/:id`  
  Delete a slot if it is not booked.
  - Responses:
    - `204 No Content` on successful deletion.
    - `404 Not Found` if the slot does not exist.
    - `409 Conflict` if the slot is already booked.

- `GET /slots/availability`  
  Query 30‑minute availability within a time range.
  - Query parameters:
    - `from` (required, string, date-time)
    - `to` (required, string, date-time)
  - Response:
    - `200 OK` with an array of 30‑minute slots derived from unbooked slots.
    - `400 Bad Request` if `from` or `to` is missing.

Example request:

```bash
curl "http://localhost:3000/slots?from=2025-11-25T09:00:00Z&to=2025-11-25T17:00:00Z&booked=false"
```

## Scripts

- `npm run dev` – Start the development server with `ts-node` and hot reloading.
- `npm run build` – Compile TypeScript to JavaScript in `dist`.
- `npm test` – Build the project and run tests with `node:test`.
- `npm run lint` – Lint the codebase with Biome.
- `npm run docker:build` – Build the Docker image.
- `npm run docker:run` – Run the Docker container (using `PORT` from `.env` and `LOG_LEVEL=debug`).

## Project Structure

```text
.
├── src
│   ├── index.ts              # Application entry point
│   ├── server.ts             # Fastify server configuration
│   ├── routes
│   │   └── slot-routes.ts    # HTTP routes for slot management
│   ├── services
│   │   └── slot-service.ts   # In-memory slot store and business rules
│   ├── types
│   │   └── slot-types.ts     # TypeBox schemas and shared types
│   └── test
│       └── routes
│           └── slot-routes.test.ts
├── .github/workflows         # GitHub Actions workflow
├── .env.example              # Example environment variables
├── Dockerfile                # Docker configuration
├── package.json              # Project metadata and scripts
└── tsconfig.json             # TypeScript configuration
```

## Testing

```bash
npm test
```

## Docker

Build the Docker image:

```bash
npm run docker:build
```

Run the Docker container:

```bash
npm run docker:run
```

## License

This project is licensed under the [MIT License](LICENSE).

## Acknowledgments

- [Fastify](https://www.fastify.io/) for the web framework.
- [TypeScript](https://www.typescriptlang.org/) for type safety.
- [TypeBox](https://github.com/sinclairzx81/typebox) for JSON schema definitions.
- Based on the Code Companion Node.js TypeScript template by [Niels Van den Broeck](https://github.com/CodeCompanionBE).
