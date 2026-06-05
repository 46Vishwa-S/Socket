export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname !== "/ws") {
      return new Response("WebSocket Relay Running", {
        status: 200,
        headers: {
          "Content-Type": "text/plain"
        }
      });
    }

    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("Expected WebSocket", {
        status: 426
      });
    }

    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];

    server.accept();

    if (!globalThis.clients) {
      globalThis.clients = new Set();
    }

    globalThis.clients.add(server);

    server.addEventListener("message", (event) => {
      const message = event.data;

      for (const ws of globalThis.clients) {
        if (ws !== server) {
          try {
            ws.send(message);
          } catch (e) {}
        }
      }
    });

    server.addEventListener("close", () => {
      globalThis.clients.delete(server);
    });

    server.addEventListener("error", () => {
      globalThis.clients.delete(server);
    });

    return new Response(null, {
      status: 101,
      webSocket: client
    });
  }
};

