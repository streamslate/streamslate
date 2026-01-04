const WebSocket = require("ws");

// Stream Deck Action Handler
// This is a simple proof-of-concept script that simulates a Stream Deck plugin
// connecting to the StreamSlate WebSocket server.

const STREAMSLATE_WS_URL = "ws://127.0.0.1:11451";

class StreamSlatePlugin {
  constructor() {
    this.ws = null;
    this.reconnectInterval = 3000;
  }

  connect() {
    console.log(`Connecting to ${STREAMSLATE_WS_URL}...`);
    this.ws = new WebSocket(STREAMSLATE_WS_URL);

    this.ws.on("open", () => {
      console.log("Connected to StreamSlate!");
      // Identify or request state
      this.sendMessage({ type: "GET_STATE" });
    });

    this.ws.on("message", (data) => {
      try {
        const message = JSON.parse(data);
        this.handleMessage(message);
      } catch (e) {
        console.error("Failed to parse message:", e);
      }
    });

    this.ws.on("close", () => {
      console.log("Disconnected. Reconnecting in 3s...");
      setTimeout(() => this.connect(), this.reconnectInterval);
    });

    this.ws.on("error", (err) => {
      console.error("WebSocket error:", err.message);
    });
  }

  sendMessage(payload) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }

  handleMessage(message) {
    console.log("Received:", message.type);
    if (message.type === "STATE") {
      console.log("Current Page:", message.page);
      console.log("Total Pages:", message.total_pages);
    } else if (message.type === "PAGE_CHANGED") {
      console.log(`Page changed to ${message.page}`);
    }
  }

  // Action methods
  nextPage() {
    console.log("Action: Next Page");
    this.sendMessage({ type: "NEXT_PAGE" });
  }

  prevPage() {
    console.log("Action: Previous Page");
    this.sendMessage({ type: "PREVIOUS_PAGE" });
  }

  togglePresenter() {
    console.log("Action: Toggle Presenter");
    this.sendMessage({ type: "TOGGLE_PRESENTER" });
  }
}

// Run if called directly
if (require.main === module) {
  const plugin = new StreamSlatePlugin();
  plugin.connect();

  // Simulate remote control
  setInterval(() => {
    // Randomly trigger an action every 5 seconds for demo purposes
    // plugin.nextPage();
  }, 5000);
}

module.exports = StreamSlatePlugin;
