// WebSocket Server Example for Real-time Messaging
// This is an example of what your backend WebSocket server should implement

const WebSocket = require('ws');
const jwt = require('jsonwebtoken');

class MessagingWebSocketServer {
  constructor(port = 5001) {
    this.port = port;
    this.wss = null;
    this.clients = new Map(); // userId -> WebSocket
    this.conversations = new Map(); // conversationId -> Set of userIds
  }

  start() {
    this.wss = new WebSocket.Server({ port: this.port });
    console.log(`WebSocket server running on port ${this.port}`);

    this.wss.on('connection', (ws, req) => {
      console.log('New WebSocket connection');
      
      // Extract token and userId from query params
      const url = new URL(req.url, `http://${req.headers.host}`);
      const token = url.searchParams.get('token');
      const userId = url.searchParams.get('userId');

      if (!token || !userId) {
        ws.close(1008, 'Missing token or userId');
        return;
      }

      try {
        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        
        // Store client connection
        this.clients.set(userId, ws);
        console.log(`User ${userId} connected`);

        // Send connection confirmation
        ws.send(JSON.stringify({
          type: 'connection',
          data: { status: 'connected', userId }
        }));

        ws.on('message', (data) => {
          try {
            const message = JSON.parse(data);
            this.handleMessage(userId, message);
          } catch (error) {
            console.error('Invalid message format:', error);
          }
        });

        ws.on('close', () => {
          console.log(`User ${userId} disconnected`);
          this.clients.delete(userId);
        });

        ws.on('error', (error) => {
          console.error(`WebSocket error for user ${userId}:`, error);
        });

      } catch (error) {
        console.error('Token verification failed:', error);
        ws.close(1008, 'Invalid token');
      }
    });
  }

  handleMessage(fromUserId, message) {
    console.log(`Message from ${fromUserId}:`, message);

    switch (message.type) {
      case 'send_message':
        this.handleSendMessage(fromUserId, message);
        break;
      case 'join_conversation':
        this.handleJoinConversation(fromUserId, message);
        break;
      case 'typing':
        this.handleTyping(fromUserId, message);
        break;
      default:
        console.log('Unknown message type:', message.type);
    }
  }

  handleSendMessage(fromUserId, message) {
    const { toUserId, text, conversationId } = message;
    
    // Create message object
    const messageObj = {
      messageId: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      conversationId: conversationId || `conv-${fromUserId}-${toUserId}`,
      fromUserId,
      toUserId,
      text,
      timestamp: new Date().toISOString(),
      isRead: false
    };

    // Send to recipient if online
    const recipientWs = this.clients.get(toUserId);
    if (recipientWs && recipientWs.readyState === WebSocket.OPEN) {
      recipientWs.send(JSON.stringify({
        type: 'message',
        data: messageObj,
        conversationId: messageObj.conversationId
      }));
    }

    // Send confirmation back to sender
    const senderWs = this.clients.get(fromUserId);
    if (senderWs && senderWs.readyState === WebSocket.OPEN) {
      senderWs.send(JSON.stringify({
        type: 'message_sent',
        data: messageObj,
        conversationId: messageObj.conversationId
      }));
    }

    // Update conversation participants
    if (!this.conversations.has(messageObj.conversationId)) {
      this.conversations.set(messageObj.conversationId, new Set());
    }
    this.conversations.get(messageObj.conversationId).add(fromUserId);
    this.conversations.get(messageObj.conversationId).add(toUserId);

    // Broadcast conversation update to all participants
    this.broadcastConversationUpdate(messageObj.conversationId);
  }

  handleJoinConversation(userId, message) {
    const { conversationId } = message;
    
    if (!this.conversations.has(conversationId)) {
      this.conversations.set(conversationId, new Set());
    }
    this.conversations.get(conversationId).add(userId);
    
    console.log(`User ${userId} joined conversation ${conversationId}`);
  }

  handleTyping(fromUserId, message) {
    const { toUserId, conversationId, isTyping } = message;
    
    const recipientWs = this.clients.get(toUserId);
    if (recipientWs && recipientWs.readyState === WebSocket.OPEN) {
      recipientWs.send(JSON.stringify({
        type: 'typing',
        data: { fromUserId, isTyping },
        conversationId
      }));
    }
  }

  broadcastConversationUpdate(conversationId) {
    const participants = this.conversations.get(conversationId);
    if (!participants) return;

    const updateMessage = {
      type: 'conversation_update',
      data: { conversationId },
      conversationId
    };

    participants.forEach(userId => {
      const ws = this.clients.get(userId);
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(updateMessage));
      }
    });
  }

  // Broadcast to all connected clients
  broadcast(message) {
    this.clients.forEach((ws, userId) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    });
  }
}

// Start the server
const server = new MessagingWebSocketServer(5001);
server.start();

module.exports = MessagingWebSocketServer;
