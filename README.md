# 🚨 IncidentFlow - Incident Management Platform

A full-featured Incident Management System built using the **MERN stack** with a **microservices architecture**. Designed for engineering teams to track, manage, and resolve incidents efficiently, with powerful features like role-based access control, password reset via email, audit logs, real-time updates, and a modern Kanban-style dashboard.

---

## 📁 Project Structure

incidentflow/
├── frontend/
│ └── client/ # React frontend (Tailwind CSS, React Router, Axios, Lucide Icons)
├── services/
│ ├── auth/ # Authentication microservice (JWT, roles, password reset)
│ ├── incident/ # Incident microservice (create, update, assign, comments, logs)
│ └── user/ # User microservice (role management, user list)


---

## ⚙️ Tech Stack

| Layer       | Tech                                                                 |
|-------------|----------------------------------------------------------------------|
| Frontend    | React, Tailwind CSS, React Router, Axios, Lucide Icons, Hot Toast    |
| Backend     | Node.js, Express.js (Microservices)                                  |
| Database    | MongoDB (Atlas or Local)                                             |
| Auth        | JWT, Bcrypt, Role-Based Access                                       |
| Emails      | Nodemailer with Mailtrap                                             |
| Styling     | Tailwind CSS + Dark Mode Support                                     |

---

## ✨ Features

### 🧑‍💻 User & Auth
- Signup / Login
- Forgot & Reset Password (via email link)
- JWT-based authentication
- Role-based access: `admin`, `responder`
- Password strength checker & visibility toggle

### 📋 Incidents
- Create, update, assign incidents
- Kanban-style dashboard: Open, In Progress, Resolved
- Drag & drop to change status (in progress)
- Colored severity tags (High, Medium, Low)
- Assign to user with avatars & badges

### 💬 Comments & Audit Logs
- Comment on incidents
- Edit/Delete comments
- View timeline of admin actions (audit logs)

### 🛠 Admin Panel
- View all users
- Promote/Demote users to/from admin
- Monitor incident assignments & status

### 🎨 UI/UX
- Fully styled with Tailwind CSS
- Responsive and mobile-friendly
- Dark mode toggle
- Toast notifications via `react-hot-toast`

---

## 🚀 Getting Started

### 1. Clone the Repo

```bash
git clone https://github.com/yourusername/incidentflow.git
cd incidentflow

2. Setup Environment Variables

Each service has its own `.env.example` file. Copy these to `.env` and fill in your actual values:

```bash
# Copy example files to .env
cp frontend/client/.env.example frontend/client/.env
cp services/auth/.env.example services/auth/.env
cp services/incident/.env.example services/incident/.env
cp services/user/.env.example services/user/.env
cp services/oncall/.env.example services/oncall/.env
```

**Important:** Never commit `.env` files to version control. They contain sensitive information and are automatically ignored by git.

3. Install Dependencies

# Example for auth service
cd services/auth
npm install

# Repeat for:
cd ../incident && npm install
cd ../user && npm install
cd ../../frontend/client && npm install

4. Run Services

# Start auth service
cd services/auth
npm run dev

# Start incident service
cd ../incident
npm run dev

# Start user service
cd ../user
npm run dev

# Start frontend
cd ../../frontend/client
npm start

Access the frontend at: http://localhost:3000

🧪 API Testing (Optional)
Use Postman to test:

POST /api/auth/register

POST /api/auth/login

POST /api/auth/forgot-password

POST /api/auth/reset-password/:token

GET /api/incidents

POST /api/incidents/:id/comments

GET /api/users, PATCH /api/users/:id/promote

📸 Screenshots
Coming soon!

🔜 Upcoming Features
Docker Compose setup

WebSocket-based real-time updates

Slack/email alerts for critical incidents

Export incident as PDF

Responsive mobile app version

👨‍💻 Author
Shubham Nimkar
Built for DevOps portfolio demonstration
Contributions welcome! PRs and feedback encouraged.

