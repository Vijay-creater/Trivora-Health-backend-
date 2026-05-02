const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { ChatMessage, ChatGroup } = require('../models/chatModels');
const { User } = require('../models/userModel');

let io;
const onlineUsers = new Map(); // userId -> socketId
const userSockets = new Map(); // socketId -> userId

const initializeSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
            credentials: true
        },
        pingTimeout: 60000,
        pingInterval: 25000
    });

    // Authentication middleware
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

            if (!token) {
                return next(new Error('Authentication error: No token provided'));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id).select('-password');

            if (!user) {
                return next(new Error('Authentication error: User not found'));
            }

            socket.userId = user._id.toString();
            socket.user = user;
            next();
        } catch (error) {
            console.error('Socket authentication error:', error);
            next(new Error('Authentication error: Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.userId}`);

        // Store user connection
        onlineUsers.set(socket.userId, socket.id);
        userSockets.set(socket.id, socket.userId);

        // Notify others that user is online
        socket.broadcast.emit('USER_ONLINE', {
            userId: socket.userId,
            username: socket.user.username
        });

        // Join user's groups
        joinUserGroups(socket);

        // Handle joining a specific group
        socket.on('JOIN_GROUP', async (data) => {
            try {
                const { groupId } = data;
                
                // Verify user is member of the group
                const group = await ChatGroup.findById(groupId);
                if (group && group.members.includes(socket.userId)) {
                    socket.join(groupId);
                    console.log(`User ${socket.userId} joined group ${groupId}`);
                    
                    // Notify group members
                    socket.to(groupId).emit('USER_JOINED_GROUP', {
                        userId: socket.userId,
                        username: socket.user.username,
                        groupId
                    });
                }
            } catch (error) {
                console.error('Join group error:', error);
                socket.emit('ERROR', { message: 'Failed to join group' });
            }
        });

        // Handle leaving a group
        socket.on('LEAVE_GROUP', (data) => {
            const { groupId } = data;
            socket.leave(groupId);
            console.log(`User ${socket.userId} left group ${groupId}`);
            
            socket.to(groupId).emit('USER_LEFT_GROUP', {
                userId: socket.userId,
                username: socket.user.username,
                groupId
            });
        });

        // Handle sending a message
        socket.on('SEND_MESSAGE', async (data) => {
            try {
                const { groupId, content, type, fileUrl, fileName, fileSize, replyTo, mentions } = data;

                // Verify user is member of the group
                const group = await ChatGroup.findById(groupId);
                if (!group || !group.members.includes(socket.userId)) {
                    return socket.emit('ERROR', { message: 'Access denied' });
                }

                // Create message
                const message = await ChatMessage.create({
                    groupId,
                    sender: socket.userId,
                    content,
                    type: type || 'text',
                    fileUrl,
                    fileName,
                    fileSize,
                    replyTo,
                    mentions: mentions || []
                });

                // Update group's last message
                group.lastMessage = message._id;
                await group.save();

                // Populate message
                const populatedMessage = await ChatMessage.findById(message._id)
                    .populate('sender', 'username email role')
                    .populate('replyTo')
                    .populate('mentions', 'username');

                // Emit to all group members
                io.to(groupId).emit('NEW_MESSAGE', populatedMessage);

                // Send notifications to mentioned users
                if (mentions && mentions.length > 0) {
                    mentions.forEach(mentionedUserId => {
                        const mentionedSocketId = onlineUsers.get(mentionedUserId);
                        if (mentionedSocketId) {
                            io.to(mentionedSocketId).emit('MENTIONED', {
                                message: populatedMessage,
                                groupId
                            });
                        }
                    });
                }

            } catch (error) {
                console.error('Send message error:', error);
                socket.emit('ERROR', { message: 'Failed to send message' });
            }
        });

        // Handle typing indicator
        socket.on('START_TYPING', (data) => {
            const { groupId } = data;
            socket.to(groupId).emit('USER_TYPING', {
                userId: socket.userId,
                username: socket.user.username,
                groupId
            });
        });

        socket.on('STOP_TYPING', (data) => {
            const { groupId } = data;
            socket.to(groupId).emit('USER_STOPPED_TYPING', {
                userId: socket.userId,
                username: socket.user.username,
                groupId
            });
        });

        // Handle message delivered
        socket.on('MARK_DELIVERED', async (data) => {
            try {
                const { messageId } = data;
                
                const message = await ChatMessage.findById(messageId);
                if (!message) return;

                // Check if already delivered
                const alreadyDelivered = message.deliveredTo.some(
                    d => d.userId.toString() === socket.userId
                );

                if (!alreadyDelivered) {
                    message.deliveredTo.push({ userId: socket.userId, deliveredAt: new Date() });
                    await message.save();

                    // Notify sender
                    const senderSocketId = onlineUsers.get(message.sender.toString());
                    if (senderSocketId) {
                        io.to(senderSocketId).emit('MESSAGE_DELIVERED', {
                            messageId,
                            userId: socket.userId,
                            deliveredAt: new Date()
                        });
                    }
                }
            } catch (error) {
                console.error('Mark delivered error:', error);
            }
        });

        // Handle message seen
        socket.on('MARK_SEEN', async (data) => {
            try {
                const { messageId } = data;
                
                const message = await ChatMessage.findById(messageId);
                if (!message) return;

                // Check if already seen
                const alreadySeen = message.seenBy.some(
                    s => s.userId.toString() === socket.userId
                );

                if (!alreadySeen) {
                    message.seenBy.push({ userId: socket.userId, seenAt: new Date() });
                    await message.save();

                    // Notify sender
                    const senderSocketId = onlineUsers.get(message.sender.toString());
                    if (senderSocketId) {
                        io.to(senderSocketId).emit('MESSAGE_SEEN', {
                            messageId,
                            userId: socket.userId,
                            seenAt: new Date()
                        });
                    }
                }
            } catch (error) {
                console.error('Mark seen error:', error);
            }
        });

        // Handle message deletion
        socket.on('DELETE_MESSAGE', async (data) => {
            try {
                const { messageId } = data;
                
                const message = await ChatMessage.findById(messageId);
                if (!message || message.sender.toString() !== socket.userId) {
                    return socket.emit('ERROR', { message: 'Cannot delete this message' });
                }

                message.isDeleted = true;
                message.content = 'This message was deleted';
                await message.save();

                // Notify group members
                io.to(message.groupId.toString()).emit('MESSAGE_DELETED', {
                    messageId,
                    groupId: message.groupId
                });
            } catch (error) {
                console.error('Delete message error:', error);
                socket.emit('ERROR', { message: 'Failed to delete message' });
            }
        });

        // Handle message pinning
        socket.on('PIN_MESSAGE', async (data) => {
            try {
                const { messageId } = data;
                
                const message = await ChatMessage.findById(messageId);
                if (!message) return;

                const group = await ChatGroup.findById(message.groupId);
                if (!group.admins.includes(socket.userId)) {
                    return socket.emit('ERROR', { message: 'Only admins can pin messages' });
                }

                message.isPinned = true;
                await message.save();

                if (!group.pinnedMessages.includes(messageId)) {
                    group.pinnedMessages.push(messageId);
                    await group.save();
                }

                // Notify group members
                io.to(message.groupId.toString()).emit('MESSAGE_PINNED', {
                    messageId,
                    groupId: message.groupId
                });
            } catch (error) {
                console.error('Pin message error:', error);
                socket.emit('ERROR', { message: 'Failed to pin message' });
            }
        });

        // Handle disconnection
        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.userId}`);
            
            onlineUsers.delete(socket.userId);
            userSockets.delete(socket.id);

            // Notify others that user is offline
            socket.broadcast.emit('USER_OFFLINE', {
                userId: socket.userId,
                username: socket.user.username
            });
        });

        // Handle errors
        socket.on('error', (error) => {
            console.error('Socket error:', error);
        });
    });

    return io;
};

// Helper function to join user's groups
const joinUserGroups = async (socket) => {
    try {
        const groups = await ChatGroup.find({ members: socket.userId });
        groups.forEach(group => {
            socket.join(group._id.toString());
        });
        console.log(`User ${socket.userId} joined ${groups.length} groups`);
    } catch (error) {
        console.error('Error joining user groups:', error);
    }
};

// Get Socket.IO instance
const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized');
    }
    return io;
};

// Get online users
const getOnlineUsers = () => {
    return Array.from(onlineUsers.keys());
};

module.exports = {
    initializeSocket,
    getIO,
    getOnlineUsers
};
