# SmartWayz Frontend

This application provides the SmartWayz user interface for citizens and authorities. It is built with React and Vite.

## Requirements

- Node.js 18+
- npm

## Development

```bash
cd frontend
npm install
npm run dev
```

The Vite development server runs on `http://localhost:5173` unless overridden locally.

## Available Scripts

- `npm run dev` starts the development server.
- `npm run build` creates a production build.
- `npm run preview` serves the production build locally.
- `npm run lint` runs the ESLint configuration for the project.

## Project Layout

```text
frontend/
├── public/
├── src/
│   ├── components/
│   ├── hooks/
│   ├── layouts/
│   ├── pages/
│   ├── services/
│   └── utils/
├── package.json
└── vite.config.js
```

## Notes

- API connectivity is configured through `VITE_API_URL`.
- Authentication and request helpers live under `src/services/` and `src/hooks/`.
- Additional integration notes are documented in the Markdown guides within this directory.
