# Security policy

## Reporting a vulnerability

Please do not open a public issue for a security vulnerability. Report it
privately to the project maintainer through the repository's private security
advisory flow or the maintainer's verified contact channel.

Include:

- A clear description of the issue
- Steps to reproduce it
- The affected platform and application version
- Any suggested mitigation

Please allow reasonable time for investigation and a fix before public
disclosure.

## Security design

The renderer runs with context isolation, no Node.js integration, and sandboxing
enabled. FNM commands are validated and executed through an allowlisted bridge
in the Electron main process.
