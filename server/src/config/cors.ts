/**
 * Browser origins allowed for both REST CORS (main.ts) and the socket.io gateway.
 *
 * Local dev origins are always allowed; production origins come from FRONTEND_URL
 * (comma-separated, e.g. "https://app.example.com,https://tana-track.vercel.app").
 * Read from process.env directly so it's available at gateway-decorator load time.
 */
export function corsOrigins(): string[] {
  const fromEnv =
    process.env.FRONTEND_URL?.split(',')
      .map((s) => s.trim())
      .filter(Boolean) ?? [];

  return [
    ...new Set([
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5500',
      ...fromEnv,
    ]),
  ];
}
