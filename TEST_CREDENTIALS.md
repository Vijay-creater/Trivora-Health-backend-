# Test User Credentials

## Login Credentials for Testing

### Admin Account
- **Email:** admin@hospital.com
- **Password:** admin123
- **Role:** ADMIN
- **Username:** admin

### Receptionist Account
- **Email:** receptionist@hospital.com
- **Password:** recep123
- **Role:** V_SQ_RECEPTIONIST
- **Username:** receptionist

### Chief Doctor Account
- **Email:** chiefdoctor@hospital.com
- **Password:** doctor123
- **Role:** CHIEF_DOCTOR
- **Username:** chiefdoctor

### Lab Admin Account
- **Email:** labadmin@hospital.com
- **Password:** lab123
- **Role:** LAB_ADMIN
- **Username:** labadmin

---

## Setup Instructions

1. **Create Test Users:**
   ```bash
   cd "Hospital-codes backend"
   node create-test-users.js
   ```

2. **Start Backend Server:**
   ```bash
   cd "Hospital-codes backend"
   npm start
   ```
   Backend will run on: http://localhost:7002

3. **Start Frontend Server:**
   ```bash
   cd "1_My_Project/Trivora-Health"
   npm run dev
   ```
   Frontend will run on: http://localhost:5173

4. **Login:**
   - Open browser to http://localhost:5173
   - Use any of the credentials above to login

---

## Notes
- All passwords follow the pattern: `[Role]123!`
- MongoDB must be running on localhost:27017
- Backend uses JWT authentication
- Passwords are hashed with bcrypt (salt rounds: 10)
