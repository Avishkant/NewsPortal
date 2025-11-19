# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Environment variables (deployment)

This project uses Vite. Environment variables that need to be available in the browser must be prefixed with `VITE_`.

- The frontend talks to the backend using `import.meta.env.VITE_BACKEND_URL`.
- Example (see `client/.env.example`):

```text
VITE_BACKEND_URL=https://api.example.com
```

Notes for deployment:

- Do not commit real secrets to the repo. Use `client/.env.example` as a template.
- When building on Render (or any CI), set the environment variable `VITE_BACKEND_URL` in the service settings so the built client points to your production API.
  - For Render static site: set `Build Command: npm install && npm run build` and set `VITE_BACKEND_URL` in Environment.
  - For a server that serves the built client, either build the client before deploying the server (CI), or set the same env var in the build environment.

Vite loads `.env` files located in the `client/` directory when running `npm run dev` or `npm run build` from inside `client/`.

If you need help wiring this into your Render service, I can add a `render.yaml` to declare separate services for the `client` (static) and the `server` (Node), or provide the exact Render UI settings to use.
