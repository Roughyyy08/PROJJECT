🚀 Life Admin OS










A personal operating system for managing life logistics — tasks, deadlines, and documents in one place.

📖 About

Life Admin OS is a productivity web app built for students and young professionals who struggle with scattered tools and missed deadlines.

Instead of juggling todo apps, notes, and cloud storage, this app provides a single unified workspace to manage:

✅ Tasks with deadlines
📁 Important documents with expiry tracking
⏳ A timeline of everything due

The goal: reduce mental overhead and prevent missed responsibilities.

✨ Features
🔐 Authentication
Firebase email/password login
Persistent sessions
🧭 Onboarding Flow
Guided 3-step first-time setup
📊 Dashboard
Tasks due this week
Overdue alerts
Document expiry warnings
Unified timeline
✅ Task Manager
Full CRUD operations
Categories, priorities, deadlines
Filters & sorting
📁 Document Vault
Secure uploads (PDF, JPG, PNG, WEBP)
Expiry tracking
Signed URL downloads
Storage quota management
🔍 Global Search
Instant search across tasks & documents
Keyboard navigation
📜 Activity Log
Track all user actions (read-only)
🧱 Tech Stack
Layer	Tech
Frontend	React 18
Build Tool	Vite
Routing	React Router v6
State	Context API
Backend	Firebase (Auth, Firestore, Storage)
Styling	TailwindCSS / CSS Modules
Date Utils	date-fns
📸 Screenshots (Coming Soon)

Add screenshots or demo GIFs here
Example:

/assets/dashboard.png
/assets/tasks.png
🏗️ Project Structure
src/
├── components/     # Reusable UI
├── pages/          # Route pages
├── context/        # Global state
├── services/       # Firebase logic
├── hooks/          # Custom hooks
├── utils/          # Helpers
├── firebase.js     # Firebase config
⚙️ Setup & Installation
1. Clone the repo
git clone https://github.com/your-username/life-admin-os.git
cd life-admin-os
2. Install dependencies
npm install
3. Configure environment variables

Create .env.local:

VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

⚠️ Do not commit .env.local

4. Run the app
npm run dev
🔐 Security
User data is isolated per user (Firestore rules)
Secure file access via signed URLs
No public data exposure
🎯 Roadmap
✅ v1 (Current Scope)
Auth
Tasks
Document Vault
Dashboard
Search
Activity Log
🚫 Not Included (v1)
Real-time collaboration
Mobile apps
Push/email notifications
AI features
Calendar integrations
📊 Success Metrics
⚡ Dashboard load < 2s
📅 ≥90% tasks have deadlines
⏳ Expiry alerts ≥7 days early
🔐 No silent auth failures
🧩 Zero empty UI states
🤝 Contributing

Currently not open for public contributions.
(You can update this later if needed.)

📄 License

Private / Internal Use Only

💡 Inspiration

Built to solve a real problem:

“Too many tools, not enough clarity.”

⭐ Future Improvements
Mobile app (React Native)
Notifications system
Calendar integrations
AI-assisted task prioritization
