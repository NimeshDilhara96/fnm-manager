# fnm_gui

A small, always-on-top desktop widget for managing Node.js versions with
[Fast Node Manager (fnm)](https://github.com/Schniz/fnm).

Developed by [@mommentx](https://github.com/mommentx).

## Features

- Compact floating widget layout
- Detects whether fnm is installed
- Installs fnm on Windows through `winget`
- Lists installed Node.js versions
- Loads available Node.js versions from fnm
- Installs and uninstalls Node.js versions
- Sets the default Node.js version
- Protects the active and system-managed versions from destructive actions
- Uses a sandboxed renderer and an allowlisted main-process command bridge

## Requirements

- Node.js and npm for development
- fnm for Node.js version management
- Windows package installation requires `winget`

The automatic fnm installer currently supports Windows only. On macOS and Linux,
install fnm using the [official fnm instructions](https://github.com/Schniz/fnm#installation).

## Getting started

```bash
npm install
npm run dev
```

The app expects `fnm` to be available on the system `PATH`. If it is missing on
Windows, the widget offers an installation button that uses `winget`.

## Building installers

```bash
# Windows
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux
```

Build output is generated in `dist/` and is intentionally ignored by Git.

## Development commands

```bash
npm run dev       # Start the development app
npm run lint      # Run ESLint
npm run format    # Format the project with Prettier
npm run build     # Build the Electron application
```

## Contributing

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) before opening a pull request.
Bug reports and feature requests are welcome through GitHub Issues.

## Security

Please read [SECURITY.md](./SECURITY.md) for responsible vulnerability
reporting instructions.

## License

This project is licensed under the [MIT License](./LICENSE).
