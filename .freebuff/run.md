# Run doc

How to stand this project up in a worktree and serve it for the Preview tab.

## How to reproduce the artifacts

- Dependencies: `npm install` (uses `package-lock.json`; this is a plain Vite + React + TypeScript app).
- Env files: none. There are no `.env*` files and the app reads no environment
  variables — `vite.config.ts` only sets the `@` → `./src` alias and the
  `react()` / `tailwindcss()` plugins. Nothing to copy from the main checkout.
- Content and media are committed under `content/` and `public/media/`; no
  generated build output is required to run the dev server. `npm run build`
  (`tsc -b && vite build`) writes `dist/` only when a production bundle is wanted.

## How to run the server

- Dev server (this is what the Preview tab uses): `npm run dev`
  - Serves on the project default port **5173**. Prefer it when free; otherwise
    pick a free port with `npm run dev -- --port <n> --strictPort`.
  - `vite.config.ts` sets `server.host: true`, so the dev server already binds
    every interface; no `--host` flag is needed for LAN access.
- Serve to other devices on the same LAN (phone, laptop): use the URL Vite prints
  as `Network:`, or one of these hostnames
  - `http://<your-LAN-IP>:5173/` (e.g. `http://192.168.1.231:5173/`)
  - `http://<hostname>.local:5173/` (e.g. `http://yujin.local:5173/`) — survives
    a DHCP address change; Windows resolves it over mDNS.
  - `localhost` on another device refers to that device and will not work.
  - `server.allowedHosts` lists `'.local'` and the bare hostname, because Vite
    answers 403 to any other `Host` header.
  - The Windows firewall must allow inbound `node.exe` on the active network
    profile. Allow rules for "Node.js JavaScript Runtime" already exist for both
    Private and Public profiles.
- **Secure-context caveat:** a LAN address served over plain HTTP is not a secure
  context for the browser, even though `localhost` is. APIs restricted to secure
  contexts are therefore missing there — notably `crypto.randomUUID`, which used
  to throw while the app loaded and left a blank page. `createKey()` in
  [src/lib/router.ts](../src/lib/router.ts) falls back to `crypto.getRandomValues`,
  which is available in insecure contexts, so keep that fallback when changing the
  router. Any new browser API must be checked against this before it is used.
- Production build preview: `npm run build` then `npm run preview`.

### Starting detached on Windows

Use PowerShell so the server outlives the session, and split stdout/stderr:

```
powershell -NoProfile -Command "(Start-Process -FilePath 'npm.cmd' -ArgumentList 'run','dev' -RedirectStandardOutput '<log>' -RedirectStandardError '<log>.err' -WindowStyle Hidden -PassThru).Id"
```

Name the executable exactly (`npm.cmd`, `node.exe`); `Start-Process` does not
resolve shell shims like `npm`. Add `'--host'` to the `-ArgumentList` to expose
the server to the LAN. Confirm it survived with
`powershell -NoProfile -Command "Get-Process -Id <pid>"`, then wait until the URL
answers before opening it.
