# Bijukaru Frontend (Svelte)

This is the Svelte-based frontend for the Bijukaru Gallery application. It provides a modern, responsive UI for browsing and viewing images from various sources.

## Prerequisites

- [Node.js](https://nodejs.org/) (v16 or later)
- [Bun](https://bun.sh/) (preferred) or npm
- [FastAPI Backend](../README.md) running locally for development

## Setup

1. Install dependencies:

```bash
# Using Bun (recommended)
bun install

# Or using npm
npm install
```

## Development

Run the development server:

```bash
# Using Bun
bun run dev

# Or using npm
npm run dev
```

This will start the Vite dev server at http://localhost:5173. The dev server is configured to proxy all `/api` requests to the FastAPI backend at http://localhost:8000.

## Building for Production

To build the application for production use:

```bash
# Standard build
bun run build

# Build and copy to FastAPI static directory
bun run build:fastapi
```

The `build:fastapi` command will build the Svelte application and copy the output files to the correct location in the FastAPI project structure (`../static/spa/`).

## Structure

- `src/` - Source code
  - `routes/` - SvelteKit routes
  - `lib/` - Shared components and utilities
  - `app.css` - Global styles
  - `app.html` - HTML template

## Integration with FastAPI

The Svelte application is designed to work with the FastAPI backend:

1. During development, API requests are proxied to the FastAPI server
2. For production, the built Svelte app is served by FastAPI as a static SPA
3. All frontend routing is handled by the Svelte app

## Environment Setup

Create a `.env` file in the frontend directory with any required environment variables:

```
PUBLIC_API_BASE_URL=/api
```

## Running the Complete Stack

1. Start the FastAPI backend:
   ```bash
   cd ..
   python -m uvicorn main:app --reload
   ```

2. In a separate terminal, start the Svelte dev server:
   ```bash
   bun run dev
   ```

3. For production, build the Svelte app and then start only the FastAPI server:
   ```bash
   bun run build:fastapi
   cd ..
   python -m uvicorn main:app
   ```