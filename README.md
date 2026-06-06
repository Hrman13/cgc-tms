# CGC University Transport Management System v2

A professional, role-based university transport portal for CGC University featuring strict access control, personal transport dashboards, community board, payment records, and admin credential management.

---

## Live Demo Credentials

| Role    | Login ID | Password    | Notes                        |
|---------|----------|-------------|------------------------------|
| Student | STU001   | student123  | Arjun Sharma — CGC-07 bus    |
| Driver  | DRV001   | driver123   | Rajinder Singh — CGC-03      |
| Driver  | DRV002   | driver456   | Gurjeet Dhaliwal — CGC-07    |
| Admin   | ADMIN01  | admin123    | Full system access            |

---

## Role-Based Access Control

### Student
- Sees **only their own** profile, assigned bus, route, pickup details, and driver info
- Cannot view other students' data
- Can browse All Bus Routes (public transport info)
- Can post/read in the Community Board
- Can change their own password

### Driver
- Sees their own profile, assigned bus, route with all stops, seat occupancy
- Sees passenger list (student names + pickup points) for their assigned bus only
- Cannot add, edit, or delete drivers
- Can view payment/salary history and download receipts
- Can change their own password

### Admin
- Full access: register students and drivers, view/delete all records
- Assign bus routes to students and drivers
- View credential metadata (password-changed status) and reset passwords
- View complete activity log

---

## Features Implemented

### Authentication
- [x] Unified login — role tabs (Student / Driver / Admin)
- [x] Simulated secure password hashing (pseudo-bcrypt for frontend demo)
- [x] Show/hide password toggle
- [x] Role-based post-login redirect

### Student Dashboard
- [x] Personal profile: name, student ID, course, semester, email
- [x] Assigned bus number and route name
- [x] Pickup point and pickup time
- [x] Drop point (CGC University, Sector 112)
- [x] Assigned driver: name, driver ID, phone number
- [x] "No assignment" notice if no bus assigned
- [x] All Bus Routes — browse every bus with full stop/timing list
- [x] Help & Coordination — Transport In-charge contact card
- [x] Community Board — post/read messages with timestamps
- [x] Change Password with current password verification

### Driver Dashboard
- [x] Personal profile: name, driver ID, phone, license, join date, assigned bus
- [x] Assigned route name and full stop table with timings
- [x] Bus occupancy bar (filled seats / total seats)
- [x] Passenger list — students on that bus with pickup points
- [x] Payment history table — monthly salary, status (Paid/Pending)
- [x] Receipt download (text file) for paid months
- [x] Change Password

### Admin Dashboard
- [x] Stats: total students, drivers, bus routes, activity events
- [x] Register Student — generates login ID, assigns bus, sets initial password
- [x] Register Driver — generates login ID, assigns bus, sets salary
- [x] All Students table with search and delete
- [x] All Drivers table with delete
- [x] Credentials & Reset — view password-changed status, reset any user's password
- [x] Activity Log — timestamped audit trail of all events
- [x] Clear Log

---

## Project Structure

```
cgc-tms/
├── index.html              ← Main SPA (all pages / panels)
├── server.js               ← Express backend entry point
├── db.js                   ← MySQL connection pool
├── package.json
│
├── public/
│   ├── css/style.css       ← Full design system with role themes
│   └── js/app.js           ← Complete frontend application logic
│
├── routes/
│   ├── auth.js             ← /login, /logout
│   ├── students.js         ← /register, /students, /search
│   ├── drivers.js          ← /driver-register, /drivers
│   └── admin.js            ← /admin/dashboard
│
├── views/                  ← EJS templates
└── database/schema.sql     ← MySQL schema + seed data
```

---

## Design System

| Element            | Student Theme       | Driver Theme        | Admin Theme         |
|--------------------|---------------------|---------------------|---------------------|
| Accent Color       | `#1d5fa8` (Blue)    | `#0f7a4d` (Green)   | `#8b1a2f` (Maroon)  |
| Sidebar Active     | Blue gradient       | Green gradient      | Maroon gradient     |
| Topbar Border      | Blue top line       | Green top line      | Maroon top line     |
| Welcome Banner     | Dark blue + blue    | Dark green + green  | Navy + maroon       |
| Portal Badge       | Blue badge          | Green badge         | Maroon badge        |

---

## Demo Bus Routes

| Bus No.  | Route Name              | Stops                                               |
|----------|-------------------------|-----------------------------------------------------|
| CGC-03   | Kharar – CGC Route      | Kharar > Phase 7 > Sector 68 > CGC (08:10 AM)      |
| CGC-07   | Chandigarh – CGC Route  | ISBT > Sector 17 > Tribune > Zirakpur > CGC (08:20) |
| CGC-12   | Morinda – CGC Route     | Morinda > Ropar > Kurali > CGC (08:05 AM)          |

---

## Backend Setup (Node.js + MySQL)

```bash
npm install
# Configure db.js with MySQL credentials
mysql -u root -p < database/schema.sql
npm start   # or: npm run dev
```

---

## Security Notes

- Passwords are hashed (bcrypt in backend, pseudo-hash in frontend demo)
- Admin never sees raw passwords — only hashed values and changed/not-changed status
- Role checks are enforced on every panel and nav item
- Students cannot access other students' data — lookups always filter by `currentUser.recordId`
- XSS prevention via `escHtml()` on all user-supplied data before rendering

---

## Planned Next Steps

- [ ] Bus GPS tracking integration
- [ ] Student fee/transport payment module  
- [ ] Push notifications for bus delays
- [ ] Admin bus route management (add/edit stops)
- [ ] Student bus change request workflow
- [ ] Export student/driver lists to Excel
- [ ] Dark mode