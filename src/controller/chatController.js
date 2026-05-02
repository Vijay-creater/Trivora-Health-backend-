const { ChatGroup, ChatMessage } = require("../models/chatModels");
const { User } = require("../models/userModel");
const mongoose = require("mongoose");

// Get all groups for a user
const getUserGroups = async (req, res) => {
    try {
        const userId = req.user.id; // JWT token contains 'id' field

        const groups = await ChatGroup.find({ members: userId })
            .populate('members', 'username email role')
            .populate('lastMessage')
            .populate({
                path: 'lastMessage',
                populate: { path: 'sender', select: 'username' }
            })
            .sort({ updatedAt: -1 });

        // Calculate unread count for each group
        const groupsWithUnread = await Promise.all(groups.map(async (group) => {
            const unreadCount = await ChatMessage.countDocuments({
                groupId: group._id,
                'seenBy.userId': { $ne: userId },
                sender: { $ne: userId }
            });

            return {
                id: group._id.toString(),
                _id: group._id,
                name: group.name,
                description: group.description,
                type: group.type,
                members: group.members.map(m => m._id.toString()),
                memberDetails: group.members,
                admins: group.admins,
                createdBy: group.createdBy,
                avatar: group.avatar,
                lastMessage: group.lastMessage,
                pinnedMessages: group.pinnedMessages,
                unreadCount,
                createdAt: group.createdAt,
                updatedAt: group.updatedAt
            };
        }));

        res.status(200).json({
            success: true,
            data: groupsWithUnread
        });
    } catch (error) {
        console.error('Get user groups error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch groups',
            error: error.message
        });
    }
};

// Create a new group
const createGroup = async (req, res) => {
    try {
        const { name, description, members, type } = req.body;
        const userId = req.user.id; // JWT token contains 'id' field

        console.log('Create group request:', { name, description, members, type, userId });

        // Validate members
        if (!members || members.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'At least one member is required'
            });
        }

        // Add creator to members if not included
        const memberIds = [...new Set([userId, ...members])];

        const group = await ChatGroup.create({
            name,
            description,
            type: type || 'group',
            members: memberIds,
            admins: [userId],
            createdBy: userId
        });

        const populatedGroup = await ChatGroup.findById(group._id)
            .populate('members', 'username email role')
            .populate('createdBy', 'username email');

        // Transform response
        const transformedGroup = {
            id: populatedGroup._id.toString(),
            _id: populatedGroup._id,
            name: populatedGroup.name,
            description: populatedGroup.description,
            type: populatedGroup.type,
            members: populatedGroup.members.map(m => m._id.toString()),
            memberDetails: populatedGroup.members,
            admins: populatedGroup.admins,
            createdBy: populatedGroup.createdBy,
            avatar: populatedGroup.avatar,
            lastMessage: populatedGroup.lastMessage,
            pinnedMessages: populatedGroup.pinnedMessages,
            createdAt: populatedGroup.createdAt,
            updatedAt: populatedGroup.updatedAt
        };

        res.status(201).json({
            success: true,
            data: transformedGroup
        });
    } catch (error) {
        console.error('Create group error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create group',
            error: error.message
        });
    }
};

// Add member to group
const addMember = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { userId: newMemberId } = req.body;
        const currentUserId = req.user.id;

        const group = await ChatGroup.findById(groupId);

        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Group not found'
            });
        }

        // Check if current user is admin
        if (!group.admins.some(id => id.toString() === currentUserId)) {
            return res.status(403).json({
                success: false,
                message: 'Only admins can add members'
            });
        }

        // Check if user already a member
        if (group.members.some(id => id.toString() === newMemberId)) {
            return res.status(400).json({
                success: false,
                message: 'User is already a member'
            });
        }

        group.members.push(newMemberId);
        await group.save();

        const updatedGroup = await ChatGroup.findById(groupId)
            .populate('members', 'username email role');

        res.status(200).json({
            success: true,
            data: updatedGroup
        });
    } catch (error) {
        console.error('Add member error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add member',
            error: error.message
        });
    }
};

// Remove member from group
const removeMember = async (req, res) => {
    try {
        const { groupId, userId: memberToRemove } = req.params;
        const currentUserId = req.user.id;

        const group = await ChatGroup.findById(groupId);

        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Group not found'
            });
        }

        // Check if current user is admin
        if (!group.admins.some(id => id.toString() === currentUserId)) {
            return res.status(403).json({
                success: false,
                message: 'Only admins can remove members'
            });
        }

        group.members = group.members.filter(id => id.toString() !== memberToRemove);
        group.admins = group.admins.filter(id => id.toString() !== memberToRemove);
        await group.save();

        const updatedGroup = await ChatGroup.findById(groupId)
            .populate('members', 'username email role');

        res.status(200).json({
            success: true,
            data: updatedGroup
        });
    } catch (error) {
        console.error('Remove member error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove member',
            error: error.message
        });
    }
};

// Get messages for a group
const getMessages = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { page = 1, limit = 50 } = req.query;
        const userId = req.user.id;

        // Check if user is member of the group
        const group = await ChatGroup.findById(groupId);
        if (!group || !group.members.some(id => id.toString() === userId)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        const messages = await ChatMessage.find({
            groupId,
            isDeleted: false
        })
            .populate('sender', 'username email role')
            .populate('replyTo')
            .populate('mentions', 'username')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await ChatMessage.countDocuments({
            groupId,
            isDeleted: false
        });

        res.status(200).json({
            success: true,
            data: messages.reverse(),
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch messages',
            error: error.message
        });
    }
};

// Send a message
const sendMessage = async (req, res) => {
    try {
        const { groupId, content, type, fileUrl, fileName, fileSize, replyTo, mentions } = req.body;
        const userId = req.user.id;

        // Check if user is member of the group
        const group = await ChatGroup.findById(groupId);
        if (!group || !group.members.some(id => id.toString() === userId)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        const message = await ChatMessage.create({
            groupId,
            sender: userId,
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

        const populatedMessage = await ChatMessage.findById(message._id)
            .populate('sender', 'username email role')
            .populate('replyTo')
            .populate('mentions', 'username');

        res.status(201).json({
            success: true,
            data: populatedMessage
        });
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send message',
            error: error.message
        });
    }
};

// Mark message as delivered
const markDelivered = async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user.id;

        const message = await ChatMessage.findById(messageId);

        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }

        // Check if already delivered
        const alreadyDelivered = message.deliveredTo.some(
            d => d.userId.toString() === userId
        );

        if (!alreadyDelivered) {
            message.deliveredTo.push({ userId, deliveredAt: new Date() });
            await message.save();
        }

        res.status(200).json({
            success: true,
            data: message
        });
    } catch (error) {
        console.error('Mark delivered error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark as delivered',
            error: error.message
        });
    }
};

// Mark message as seen
const markSeen = async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user.id;

        const message = await ChatMessage.findById(messageId);

        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }

        // Check if already seen
        const alreadySeen = message.seenBy.some(
            s => s.userId.toString() === userId
        );

        if (!alreadySeen) {
            message.seenBy.push({ userId, seenAt: new Date() });
            await message.save();
        }

        res.status(200).json({
            success: true,
            data: message
        });
    } catch (error) {
        console.error('Mark seen error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark as seen',
            error: error.message
        });
    }
};

// Pin/Unpin message
const togglePinMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user.id;

        const message = await ChatMessage.findById(messageId);

        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }

        // Check if user is admin of the group
        const group = await ChatGroup.findById(message.groupId);
        if (!group.admins.some(id => id.toString() === userId)) {
            return res.status(403).json({
                success: false,
                message: 'Only admins can pin messages'
            });
        }

        message.isPinned = !message.isPinned;
        await message.save();

        // Update group's pinned messages
        if (message.isPinned) {
            if (!group.pinnedMessages.includes(messageId)) {
                group.pinnedMessages.push(messageId);
            }
        } else {
            group.pinnedMessages = group.pinnedMessages.filter(
                id => id.toString() !== messageId
            );
        }
        await group.save();

        res.status(200).json({
            success: true,
            data: message
        });
    } catch (error) {
        console.error('Toggle pin error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to toggle pin',
            error: error.message
        });
    }
};

// Delete message
const deleteMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user.id;

        const message = await ChatMessage.findById(messageId);

        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }

        // Only sender can delete their message
        if (message.sender.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: 'You can only delete your own messages'
            });
        }

        message.isDeleted = true;
        message.content = 'This message was deleted';
        await message.save();

        res.status(200).json({
            success: true,
            data: message
        });
    } catch (error) {
        console.error('Delete message error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete message',
            error: error.message
        });
    }
};

// Search messages
const searchMessages = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { query } = req.query;
        const userId = req.user.id;

        // Check if user is member of the group
        const group = await ChatGroup.findById(groupId);
        if (!group || !group.members.some(id => id.toString() === userId)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        const messages = await ChatMessage.find({
            groupId,
            content: { $regex: query, $options: 'i' },
            isDeleted: false
        })
            .populate('sender', 'username email role')
            .sort({ createdAt: -1 })
            .limit(50);

        res.status(200).json({
            success: true,
            data: messages
        });
    } catch (error) {
        console.error('Search messages error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to search messages',
            error: error.message
        });
    }
};

// Search users for adding to group
const searchUsers = async (req, res) => {
    try {
        const { query } = req.query;

        const users = await User.find({
            $or: [
                { username: { $regex: query, $options: 'i' } },
                { email: { $regex: query, $options: 'i' } }
            ]
        })
            .select('username email role')
            .limit(20);

        res.status(200).json({
            success: true,
            data: users
        });
    } catch (error) {
        console.error('Search users error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to search users',
            error: error.message
        });
    }
};

module.exports = {
    getUserGroups,
    createGroup,
    addMember,
    removeMember,
    getMessages,
    sendMessage,
    markDelivered,
    markSeen,
    togglePinMessage,
    deleteMessage,
    searchMessages,
    searchUsers
};
