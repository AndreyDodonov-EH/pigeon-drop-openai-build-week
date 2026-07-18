import { defineConfig } from 'vite';

// 5199 is this project's reserved dev port: other apps' dev servers (typically
// on Vite's default 5173) never collide with it, and tooling (run-game
// screenshots) can find a running instance instead of spawning its own.
// strictPort keeps it honest — fail loudly rather than drift to another port.
// host '::' exposes the server on the LAN (WSL is configured to forward it).
export default defineConfig({
  server: {
    port: 5199,
    strictPort: true,
    host: '::',
  },
});
