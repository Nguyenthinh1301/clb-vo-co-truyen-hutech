/**
 * WebSocket Service
 * Real-time communication service using Socket.IO
 */

const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const logger = require('./loggerService');

class WebSocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // userId -> socketId
    this.userSockets = new Map(); // socketId -> userId
  }

  /**
   * Initialize WebSocket server
   */
  initialize(server) {
    this.io = socketIO(server, {
      cors: {
        origin: process.env.CORS_ORIGIN || '*',
        methods: ['GET', 'POST'],
        credentials: true
      },
      pingTimeout: 60000,
      pingInterval: 25000
    });

    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
        
        if (!token) {
          return next(new Error('Authentication error: No token provided'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.id;
        socket.userRole = decoded.role;
        
        next();
      } catch (error) {
        logger.error('WebSocket authentication failed:', error);
        next(new Error('Authentication error: Invalid token'));
      }
    });

    // Connection handler
    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });

    logger.info('WebSocket service initialized');
  }

  /**
   * Handle new socket connection
   */
  handleConnection(socket) {
    const userId = socket.userId;
    
    // Store connection
    this.connectedUsers.set(userId, socket.id);
    this.userSockets.set(socket.id, userId);

    logger.info(`User ${userId} connected via WebSocket (${socket.id})`);

    // Join user's personal room
    socket.join(`user:${userId}`);

    // Join role-based rooms
    if (socket.userRole) {
      socket.join(`role:${socket.userRole}`);
    }

    // Send connection confirmation
    socket.emit('connected', {
      message: 'Connected to WebSocket server',
      userId: userId,
      socketId: socket.id
    });

    // Handle events
    this.setupEventHandlers(socket);

    // Handle disconnection
    socket.on('disconnect', () => {
      this.handleDisconnection(socket);
    });
  }

  /**
   * Setup event handlers for socket
   */
  setupEventHandlers(socket) {
    // Join specific rooms
    socket.on('join:class', (classId) => {
      socket.join(`class:${classId}`);
      logger.info(`User ${socket.userId} joined class room ${classId}`);
    });

    socket.on('leave:class', (classId) => {
      socket.leave(`class:${classId}`);
      logger.info(`User ${socket.userId} left class room ${classId}`);
    });

    socket.on('join:event', (eventId) => {
      socket.join(`event:${eventId}`);
      logger.info(`User ${socket.userId} joined event room ${eventId}`);
    });

    socket.on('leave:event', (eventId) => {
      socket.leave(`event:${eventId}`);
      logger.info(`User ${socket.userId} left event room ${eventId}`);
    });

    // Typing indicators
    socket.on('typing:start', (data) => {
      socket.to(data.room).emit('user:typing', {
        userId: socket.userId,
        room: data.room
      });
    });

    socket.on('typing:stop', (data) => {
      socket.to(data.room).emit('user:stopped-typing', {
        userId: socket.userId,
        room: data.room
      });
    });

    // Presence updates
    socket.on('presence:update', (status) => {
      this.broadcastPresence(socket.userId, status);
    });
  }

  /**
   * Handle socket disconnection
   */
  handleDisconnection(socket) {
    const userId = socket.userId;
    
    this.connectedUsers.delete(userId);
    this.userSockets.delete(socket.id);

    logger.info(`User ${userId} disconnected from WebSocket`);

    // Broadcast offline status
    this.broadcastPresence(userId, 'offline');
  }

  /**
   * Send notification to specific user
   */
  sendToUser(userId, event, data) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.io.to(`user:${userId}`).emit(event, data);
      return true;
    }
    return false;
  }

  /**
   * Send notification to multiple users
   */
  sendToUsers(userIds, event, data) {
    userIds.forEach(userId => {
      this.sendToUser(userId, event, data);
    });
  }

  /**
   * Broadcast to all users with specific role
   */
  sendToRole(role, event, data) {
    this.io.to(`role:${role}`).emit(event, data);
  }

  /**
   * Broadcast to class members
   */
  sendToClass(classId, event, data) {
    this.io.to(`class:${classId}`).emit(event, data);
  }

  /**
   * Broadcast to event participants
   */
  sendToEvent(eventId, event, data) {
    this.io.to(`event:${eventId}`).emit(event, data);
  }

  /**
   * Broadcast to all connected users
   */
  broadcast(event, data) {
    this.io.emit(event, data);
  }

  /**
   * Broadcast user presence
   */
  broadcastPresence(userId, status) {
    this.broadcast('user:presence', {
      userId,
      status,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send real-time notification
   */
  sendNotification(userId, notification) {
    this.sendToUser(userId, 'notification:new', notification);
  }

  /**
   * Send class update
   */
  sendClassUpdate(classId, update) {
    this.sendToClass(classId, 'class:update', update);
  }

  /**
   * Send event update
   */
  sendEventUpdate(eventId, update) {
    this.sendToEvent(eventId, 'event:update', update);
  }

  /**
   * Send attendance update
   */
  sendAttendanceUpdate(classId, attendance) {
    this.sendToClass(classId, 'attendance:update', attendance);
  }

  /**
   * Get connected users count
   */
  getConnectedUsersCount() {
    return this.connectedUsers.size;
  }

  /**
   * Get connected users list
   */
  getConnectedUsers() {
    return Array.from(this.connectedUsers.keys());
  }

  /**
   * Check if user is online
   */
  isUserOnline(userId) {
    return this.connectedUsers.has(userId);
  }

  /**
   * Get service statistics
   */
  getStats() {
    return {
      connectedUsers: this.connectedUsers.size,
      totalSockets: this.userSockets.size,
      rooms: this.io ? this.io.sockets.adapter.rooms.size : 0
    };
  }
}

// Export singleton instance
module.exports = new WebSocketService();
