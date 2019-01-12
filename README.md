#### Installation guidance

---
- Download **node.js** https://nodejs.org/en/ and install it
- Extract a content of the project archive to separated directory
- Switch to the directory of the project
- Run shell command: **npm install**
- Build C++ native module: **npm run build**
- For Linux users run this shell command:
**sudo setcap 'cap_net_bind_service=+ep' /usr/bin/node**
- Run a web app server: **node index**
- Open http://localhost
