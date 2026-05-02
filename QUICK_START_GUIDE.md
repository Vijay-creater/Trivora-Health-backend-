# 🚀 Quick Start Guide - Hospital Management System

## ✅ Current Status

### Servers Running:
- ✅ **Backend Server:** http://localhost:7002
- ✅ **WebSocket Server:** http://localhost:7002
- ✅ **Frontend Server:** http://localhost:5174
- ✅ **Database:** MongoDB connected (localhost:27017/Vsq_Hospital_db)

---

## 🔑 Login Credentials

### Admin Account (Full Access)
```
Email: admin@hospital.com
Password: admin123
```

### Receptionist Account
```
Email: receptionist@hospital.com
Password: recep123
```

### Chief Doctor Account
```
Email: chiefdoctor@hospital.com
Password: doctor123
```

### Lab Admin Account
```
Email: labadmin@hospital.com
Password: lab123
```

---

## 🎯 How to Login

1. Open your browser and go to: **http://localhost:5174**
2. Enter one of the email addresses above
3. Enter the corresponding password
4. Click "Login"

---

## 🛠️ Server Management

### Start Backend Server:
```bash
cd "Hospital-codes backend"
npm run dev
```

### Start Frontend Server:
```bash
cd "1_My_Project/Trivora-Health"
npm run dev
```

### Create/Reset Test Users:
```bash
cd "Hospital-codes backend"
node create-test-users.js
```

---

## 💬 Chat System Features

The system includes a complete WhatsApp-like chat system with:

- ✅ Real-time messaging with WebSocket
- ✅ Group chat creation and management
- ✅ File uploads (images, documents)
- ✅ @mentions with autocomplete dropdown
- ✅ Typing indicators
- ✅ Message status (sent/delivered/seen)
- ✅ Online/offline status
- ✅ Unread message counts

### Access Chat:
1. Login with any account
2. Look for the chat icon (floating button) on the bottom right
3. Click to open chat modal
4. Create a new group or select existing group
5. Start chatting!

---

## 🔧 Troubleshooting

### Cannot Login?
- Make sure both backend and frontend servers are running
- Check that MongoDB is running on localhost:27017
- Run `node create-test-users.js` to reset user passwords
- Check browser console for errors (F12)

### Port Already in Use?
- Backend uses port 7002
- Frontend uses port 5173 (or next available port like 5174)
- Stop other applications using these ports

### Database Connection Error?
- Make sure MongoDB is installed and running
- Check connection string in `.env` file
- Default: `mongodb://localhost:27017/Vsq_Hospital_db`

---

## 📁 Important Files

### Backend:
- `src/index.js` - Main server file
- `src/routes/chatRoutes.js` - Chat API endpoints
- `src/services/socketService.js` - WebSocket service
- `src/models/chatModels.js` - Chat database models
- `.env` - Environment configuration

### Frontend:
- `src/contexts/ChatContext.tsx` - Chat state management
- `src/services/chatService.ts` - Chat API calls
- `src/services/socketService.ts` - WebSocket client
- `src/Components/chat/*` - Chat UI components
- `.env` - API endpoints configuration

---

## 🎉 You're All Set!

Both servers are running and test users are created. You can now:
1. Login at http://localhost:5174
2. Explore the hospital management features
3. Test the real-time chat system
4. Create groups and send messages

**Need help?** Check the console logs in both terminal windows for any errors.
