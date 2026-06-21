import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { auth } from 'src/lib/auth';
import { corsOrigins } from 'src/config/cors';

/** Per-user room name. */
const room = (userId: string) => `user_${userId}`;

/**
 * Pushes notifications to connected clients over socket.io.
 *
 * Unlike a userId-in-query approach, the socket's identity is derived from the
 * better-auth **session cookie** sent on the handshake — a client can't claim to
 * be another user. Each authenticated socket joins its own `user_<id>` room and
 * `sendToUser` emits to that room (handles multiple tabs/devices for free).
 */
@WebSocketGateway({
  // Allowed browser origins come from corsOrigins() (localhost + FRONTEND_URL),
  // so the production Vercel origin is configured via env, not hardcoded here.
  cors: {
    origin: corsOrigins(),
    credentials: true,
  },
})
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(NotificationGateway.name);

  async handleConnection(client: Socket) {
    try {
      const session = await auth.api.getSession({
        headers: this.toHeaders(client.handshake.headers),
      });

      const userId = session?.user?.id;
      if (!userId) {
        this.logger.warn('Socket rejected: no valid session');
        client.disconnect();
        return;
      }

      // Stash for disconnect logging and join the user's private room.
      client.data.userId = userId;
      await client.join(room(userId));
      this.logger.log(`Socket ${client.id} joined ${room(userId)}`);
    } catch (err) {
      this.logger.error('Socket auth failed', err as Error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data?.userId as string | undefined;
    if (userId) this.logger.log(`Socket ${client.id} left ${room(userId)}`);
  }

  /** Emit one notification payload to every live socket for a user. */
  sendToUser(userId: string, payload: unknown) {
    this.server.to(room(userId)).emit('notification', payload);
  }

  /** Node's IncomingHttpHeaders → the web `Headers` better-auth expects. */
  private toHeaders(raw: Record<string, string | string[] | undefined>) {
    const headers = new Headers();
    for (const [key, value] of Object.entries(raw)) {
      if (Array.isArray(value)) value.forEach((v) => headers.append(key, v));
      else if (value != null) headers.set(key, value);
    }
    return headers;
  }
}
