# Contributing to fnm_gui

Thanks for helping improve fnm_gui.

## Development setup

1. Install Node.js and npm.
2. Install fnm, or use the Windows in-app installer.
3. Clone the repository and install dependencies:

   ```bash
   npm install
   ```

4. Start the development app:

   ```bash
   npm run dev
   ```

## Before opening a pull request

Run the checks relevant to your change:

```bash
npm run lint
npm run build
```

Keep pull requests focused, explain the user-visible impact, and include
validation steps. Do not commit `node_modules/`, `out/`, `dist/`, secrets, or
machine-specific configuration.
