# 🗳️ AI-Enhanced Community Voting Platform

---

## 📌 Project Overview
A secure, cloud-based online voting system designed for community-level elections. The platform ensures fair voting through authentication, behavioral analysis, and admin-controlled monitoring.

---

## 🎯 Problem Statement
Traditional small-scale voting systems lack transparency, are prone to manipulation, and do not provide proper mechanisms to prevent duplicate or fraudulent voting.

---

## 💡 Solution
This project implements a web-based voting platform using modern technologies with:
- Role-based access (Admin & Voter)
- Secure authentication (JWT + Google login)
- Fraud detection system
- Controlled voting mechanism

---

## 👥 User Roles

### 🧑 Voter
- Register/Login (Google or manual)
- View candidates
- Cast vote (only once)
- Apply as nominee
- View limited results

### 🧑‍💼 Admin
- Login as admin
- Approve/reject nominees
- View all votes and vote counts
- Monitor suspicious activity
- Manage users

---

## 🖥️ Application Pages

### 🔓 Public Pages
- Login Page (Admin / Voter selection)

### 🧑 Voter Pages
- Dashboard  
- Voting Page  
- Results Page (limited)  
- Nomination Page  

### 🧑‍💼 Admin Pages
- Admin Dashboard  
- Candidate Approval Page  
- Full Results Page  
- Vote Monitoring Page  

---

## 🔐 Authentication System

### JWT Authentication
Used for secure session handling. After login, users receive a token that must be sent with every request.

### Google Login
Used for easy and secure user authentication.

---

## 🗳️ Voting Security Mechanism

### 🔒 Vote Protection Flow
- User logs in  
- Selects candidate  
- Must re-enter password before voting  
- Backend verifies credentials  
- Vote is recorded  
- User cannot vote again  

---

### 🛡️ Security Layers
- One vote per user  
- Password re-authentication before voting  
- JWT-based API protection  
- Device fingerprint tracking (non-sensitive)  
- IP monitoring  
- Fraud detection system  

---

## 🤖 Fraud Detection System

### Detection Parameters
- Multiple accounts from same device  
- Rapid voting activity  
- New account voting instantly  
- IP-based anomalies  

### Risk Scoring System

| Condition | Score |
|----------|------|
| Same device | +3 |
| Same IP | +2 |
| Fast voting | +3 |
| New account | +2 |

### Classification
- 0–2 → Normal  
- 3–5 → Suspicious  
- 6+ → Highly Suspicious  

### Important Design Principle
The system does NOT penalize popular candidates. Only abnormal behavior is flagged.

---

## 🧑‍💼 Admin Controls
- View suspicious votes  
- Remove invalid votes  
- Block users  
- Monitor voting patterns  
- Approve/reject nominees  

---

## 🔄 Nomination System
- Voter applies for nomination  
- Stored as pending  
- Admin approves/rejects  
- Approved users become candidates  

---

## 📱 Device Fingerprinting (Non-Sensitive)

To help detect multiple account abuse, the system generates a device fingerprint using non-sensitive browser data.

### Data Collected
- User agent (browser and OS)  
- Screen resolution  
- Language  
- Timezone  

### Device ID Generation
device_id = hash(userAgent + screen + language + timezone)

### Usage
- Stored in user and vote records  
- Used to detect multiple accounts from the same device  
- Contributes to fraud risk scoring  

### Privacy Consideration
- No personal or sensitive data is stored  
- The fingerprint is non-deterministic and used only for behavioral analysis  

---

## 🗄️ Database Design

### Users
- id  
- username  
- password_hash  
- role (admin/voter)  
- has_voted  
- device_id  

### Candidates
- id  
- name  
- approved  

### Votes
- id  
- user_id  
- candidate_id  
- timestamp  
- ip_address  
- device_id  
- risk_score  
- is_suspicious  

### Nominations
- id  
- user_id  
- status  

---

## 🌐 API Structure

### Auth
- POST /register  
- POST /login  
- POST /google-login  

### Voting
- GET /candidates  
- POST /vote  

### Nomination
- POST /apply-nomination  
- GET /pending-nominations  
- POST /approve-nomination  

### Admin
- GET /all-votes  
- GET /full-results  
- GET /users  

---

## ⚙️ Tech Stack

### Backend
- FastAPI  
- SQLAlchemy  

### Database
- PostgreSQL  

### Frontend
- React (Vite)  
- Tailwind CSS  

### Deployment
- Backend: Render  
- Frontend: Netlify  

---

## 🔐 Security Considerations
- Password hashing (bcrypt)  
- Role-based access control  
- No direct device tracking (privacy compliant)  
- Fraud detection via behavior analysis  

---

## 🚀 Future Enhancements
- Mobile app with biometric authentication  
- Advanced AI/ML fraud detection  
- Geo-location analysis  
- Real-time analytics dashboard  

---

## 🧠 Key Highlight
This system focuses on behavioral fraud detection rather than restricting users unfairly, ensuring both security and fairness.
