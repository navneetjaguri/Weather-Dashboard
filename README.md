# React + Vite

A minimal setup to get React working in Vite with Hot Module Replacement (HMR) and ESLint rules preconfigured.

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- npm, yarn, or pnpm

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd <your-project-name>

# Install dependencies
npm install
```

### Running the Dev Server

```bash
npm run dev
```

### Building for Production

```bash
npm run build
```

### Preview the Production Build

```bash
npm run preview
```

---

## Official Plugins

Two official Vite plugins are available for React support. Choose one based on your preference:

| Plugin | Transformer | Notes |
|---|---|---|
| `@vitejs/plugin-react` | [Oxc](https://oxc.rs/) | Faster, Rust-based toolchain |
| `@vitejs/plugin-react-swc` | [SWC](https://swc.rs/) | Speedy Web Compiler |

To switch plugins, update your `vite.config.js`:

```js
// Using Oxc (default)
import react from '@vitejs/plugin-react'

// OR using SWC
import react from '@vitejs/plugin-react-swc'

export default {
  plugins: [react()],
}
```

---

## React Compiler

> ⚠️ The React Compiler is **not enabled** in this template due to its impact on development and build performance.

To opt in, follow the [official React Compiler documentation](https://react.dev/learn/react-compiler).

---

## ESLint Configuration

Basic ESLint rules are included out of the box. For production applications, it is strongly recommended to enable type-aware lint rules with TypeScript.

### Enabling TypeScript + typescript-eslint

Refer to the [TypeScript + Vite template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for guidance on integrating:

- TypeScript
- `typescript-eslint`
- Type-aware lint rules

---

## Project Structure

```
├── public/             # Static assets
├── src/
│   ├── assets/         # Images, fonts, etc.
│   ├── App.jsx         # Root component
│   └── main.jsx        # Entry point
├── index.html
├── vite.config.js
├── eslint.config.js
└── package.json
```

---

## License

This project is open source and available under the [MIT License](LICENSE).
