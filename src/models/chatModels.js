const mongoose = require("mongoose");

// Chat Group Schema
const chatGroupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    type: {
        type: String,
        enum: ['private', 'group'],
        default: 'group'
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    admins: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    avatar: {
        type: String
    },
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChatMessage'
    },
    pinnedMessages: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChatMessage'
    }]
}, {
    timestamps: true
});

// Chat Message Schema
const chatMessageSchema = new mongoose.Schema({
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChatGroup',
        required: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        trim: true
    },
    type: {
        type: String,
        enum: ['text', 'file', 'image', 'video', 'audio', 'document'],
        default: 'text'
    },
    fileUrl: {
        type: String
    },
    fileName: {
        type: String
    },
    fileSize: {
        type: Number
    },
    replyTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChatMessage'
    },
    mentions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    isPinned: {
        type: Boolean,
        default: false
    },
    isEdited: {
        type: Boolean,
        default: false
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    deliveredTo: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        deliveredAt: {
            type: Date,
            default: Date.now
        }
    }],
    seenBy: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        seenAt: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

// Indexes for better performance
chatGroupSchema.index({ members: 1 });
chatGroupSchema.index({ createdAt: -1 });
chatMessageSchema.index({ groupId: 1, createdAt: -1 });
chatMessageSchema.index({ sender: 1 });

const ChatGroup = mongoose.model("ChatGroup", chatGroupSchema);
const ChatMessage = mongoose.model("ChatMessage", chatMessageSchema);

module.exports = { ChatGroup, ChatMessage };
