/* ============================================================
   CGC University Transport Management System — App Logic v2
   Role-Based: Student | Driver | Admin
   ============================================================ */
'use strict';

/* =====================================================================
   CONSTANTS & SIMULATED HASH (bcrypt-equivalent placeholder)
   In a real backend bcrypt hashes are used server-side.
   Here we store a simple hash token alongside a flag.
   ===================================================================== */
function simpleHash(str) {
  // Deterministic pseudo-hash for demo (NOT cryptographic)
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h) ^ str.charCodeAt(i);
  return (h >>> 0).toString(16).padStart(8, '0');
}

/* =====================================================================
   DATA STORE (localStorage-backed)
   ===================================================================== */
const DB = {
  get students()    { return JSON.parse(localStorage.getItem('cgc2_students')    || '[]'); },
  set students(v)   { localStorage.setItem('cgc2_students',    JSON.stringify(v)); },
  get drivers()     { return JSON.parse(localStorage.getItem('cgc2_drivers')     || '[]'); },
  set drivers(v)    { localStorage.setItem('cgc2_drivers',     JSON.stringify(v)); },
  get buses()       { return JSON.parse(localStorage.getItem('cgc2_buses')       || '[]'); },
  set buses(v)      { localStorage.setItem('cgc2_buses',       JSON.stringify(v)); },
  get chatMessages(){ return JSON.parse(localStorage.getItem('cgc2_chat')        || '[]'); },
  set chatMessages(v){ localStorage.setItem('cgc2_chat',       JSON.stringify(v)); },
  get activityLog() { return JSON.parse(localStorage.getItem('cgc2_activity')    || '[]'); },
  set activityLog(v){ localStorage.setItem('cgc2_activity',    JSON.stringify(v)); },
  get adminCreds()  { return JSON.parse(localStorage.getItem('cgc2_admin')       || 'null'); },
  set adminCreds(v) { localStorage.setItem('cgc2_admin',       JSON.stringify(v)); },
};

/* =====================================================================
   APP STATE
   ===================================================================== */
let currentRole = 'student';
let currentUser = null;   // { role, id, name, recordId }

/* =====================================================================
   UTILITIES
   ===================================================================== */
function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().substring(0, 2);
}

function timeAgo(ts) {
  const d = Date.now() - ts;
  if (d < 60000)     return 'Just now';
  if (d < 3600000)   return Math.floor(d / 60000) + 'm ago';
  if (d < 86400000)  return Math.floor(d / 3600000) + 'h ago';
  return new Date(ts).toLocaleDateString('en-IN');
}

function formatDate(ts) {
  if (!ts) return '---';
  return new Date(ts).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
}

function logActivity(action, details) {
  const logs = DB.activityLog;
  logs.unshift({ id: Date.now(), action, details, ts: Date.now() });
  if (logs.length > 150) logs.pop();
  DB.activityLog = logs;
}

function escHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
function escRe(str) { return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

function showAlert(id, msg)  { const e = document.getElementById(id); if (e) { e.textContent = msg; e.classList.add('show'); } }
function hideAlert(id)       { const e = document.getElementById(id); if (e) e.classList.remove('show'); }
function showLoginError(msg) { document.getElementById('login-error-text').textContent = msg; document.getElementById('login-error').classList.add('show'); }
function hideLoginError()    { document.getElementById('login-error').classList.remove('show'); }

function nextId(arr) { return arr.length ? Math.max(...arr.map(x => x.id)) + 1 : 1; }

/* =====================================================================
   SEED DATA
   ===================================================================== */
function seedAll() {
  // Admin creds
  if (!DB.adminCreds) {
    DB.adminCreds = { id: 'ADMIN01', passwordHash: simpleHash('admin123'), name: 'Administrator' };
  }

  // Buses / Routes
  if (DB.buses.length === 0) {
    DB.buses = [
      {
        id: 1, bus_no: 'CGC-03', route_name: 'Kharar – CGC Route', total_seats: 40,
        driver_id: 1,
        stops: [
          { point: 'Kharar Bus Stand',     time: '07:15 AM' },
          { point: 'Phase 7 Mohali',       time: '07:30 AM' },
          { point: 'Sector 68 Mohali',     time: '07:45 AM' },
          { point: 'CGC University',       time: '08:10 AM', drop: true },
        ]
      },
      {
        id: 2, bus_no: 'CGC-07', route_name: 'Chandigarh – CGC Route', total_seats: 50,
        driver_id: 2,
        stops: [
          { point: 'ISBT Chandigarh',      time: '07:00 AM' },
          { point: 'Sector 17 Chd',        time: '07:15 AM' },
          { point: 'Tribune Chowk',        time: '07:30 AM' },
          { point: 'Zirakpur',             time: '07:50 AM' },
          { point: 'CGC University',       time: '08:20 AM', drop: true },
        ]
      },
      {
        id: 3, bus_no: 'CGC-12', route_name: 'Morinda – CGC Route', total_seats: 35,
        driver_id: 3,
        stops: [
          { point: 'Morinda Town',         time: '06:45 AM' },
          { point: 'Ropar Bus Stand',      time: '07:10 AM' },
          { point: 'Kurali',               time: '07:35 AM' },
          { point: 'CGC University',       time: '08:05 AM', drop: true },
        ]
      },
    ];
  }

  // Drivers
  if (DB.drivers.length === 0) {
    DB.drivers = [
      {
        id: 1, name: 'Rajinder Singh', phone: '+91 98140 11001',
        license_no: 'PB-0520220001', bus_id: 1,
        join_date: Date.now() - 86400000 * 720,
        salary: 18000,
        login_id: 'DRV001',
        passwordHash: simpleHash('driver123'),
        pwChanged: false,
        created_at: Date.now() - 86400000 * 720,
      },
      {
        id: 2, name: 'Gurjeet Dhaliwal', phone: '+91 87654 22002',
        license_no: 'PB-0520220002', bus_id: 2,
        join_date: Date.now() - 86400000 * 540,
        salary: 19500,
        login_id: 'DRV002',
        passwordHash: simpleHash('driver456'),
        pwChanged: false,
        created_at: Date.now() - 86400000 * 540,
      },
      {
        id: 3, name: 'Harpreet Sandhu', phone: '+91 76543 33003',
        license_no: 'PB-0520220003', bus_id: 3,
        join_date: Date.now() - 86400000 * 360,
        salary: 17500,
        login_id: 'DRV003',
        passwordHash: simpleHash('driver789'),
        pwChanged: false,
        created_at: Date.now() - 86400000 * 360,
      },
    ];
  }

  // Students
  if (DB.students.length === 0) {
    DB.students = [
      {
        id: 1, name: 'Arjun Sharma', email: 'arjun@cgc.edu.in',
        course: 'B.Tech CSE', semester: '3rd Semester', bus_id: 2,
        login_id: 'STU001', passwordHash: simpleHash('student123'),
        pwChanged: false, created_at: Date.now() - 86400000 * 5,
      },
      {
        id: 2, name: 'Priya Kaur', email: 'priya@cgc.edu.in',
        course: 'BCA', semester: '1st Semester', bus_id: 1,
        login_id: 'STU002', passwordHash: simpleHash('stu2pass'),
        pwChanged: false, created_at: Date.now() - 86400000 * 4,
      },
      {
        id: 3, name: 'Rohit Verma', email: 'rohit@cgc.edu.in',
        course: 'MBA', semester: '2nd Semester', bus_id: 2,
        login_id: 'STU003', passwordHash: simpleHash('stu3pass'),
        pwChanged: false, created_at: Date.now() - 86400000 * 3,
      },
      {
        id: 4, name: 'Simran Grewal', email: 'simran@cgc.edu.in',
        course: 'B.Tech ECE', semester: '5th Semester', bus_id: 3,
        login_id: 'STU004', passwordHash: simpleHash('stu4pass'),
        pwChanged: false, created_at: Date.now() - 86400000 * 2,
      },
      {
        id: 5, name: 'Manpreet Singh', email: 'manpreet@cgc.edu.in',
        course: 'BBA', semester: '4th Semester', bus_id: 1,
        login_id: 'STU005', passwordHash: simpleHash('stu5pass'),
        pwChanged: false, created_at: Date.now() - 86400000,
      },
    ];
  }

  // Seed payment records per driver
  const keys = ['cgc2_pay_1','cgc2_pay_2','cgc2_pay_3'];
  const months = ['November 2024','December 2024','January 2025','February 2025','March 2025'];
  DB.drivers.forEach(d => {
    const key = 'cgc2_pay_' + d.id;
    if (!localStorage.getItem(key)) {
      const recs = months.map((m, i) => ({
        month: m,
        amount: d.salary || 18000,
        status: i < months.length - 1 ? 'Paid' : 'Pending',
        date_paid: i < months.length - 1 ? new Date(Date.now() - 86400000 * (months.length - 1 - i) * 30).toLocaleDateString('en-IN') : null,
      }));
      localStorage.setItem(key, JSON.stringify(recs));
    }
  });

  if (DB.activityLog.length === 0) {
    logActivity('System', 'CGC University TMS v2 initialized with demo data');
  }
}

/* =====================================================================
   LOGIN
   ===================================================================== */
function setRole(role) {
  currentRole = role;
  document.querySelectorAll('.role-tab').forEach(b => b.classList.toggle('active', b.dataset.role === role));
  const labels = { student: 'Student ID', driver: 'Driver ID', admin: 'Admin ID' };
  const ph     = { student: 'Enter Student ID', driver: 'Enter Driver ID', admin: 'Enter Admin ID' };
  document.getElementById('id-label').textContent = labels[role];
  document.getElementById('login-id').placeholder  = ph[role];
  hideLoginError();
}

function togglePassword() {
  const inp  = document.getElementById('login-password');
  const icon = document.getElementById('eye-icon');
  if (inp.type === 'password') { inp.type = 'text';     icon.className = 'bi bi-eye-slash'; }
  else                          { inp.type = 'password'; icon.className = 'bi bi-eye'; }
}

document.getElementById('login-form').addEventListener('submit', function(e) {
  e.preventDefault();
  hideLoginError();
  const enteredId = document.getElementById('login-id').value.trim();
  const enteredPw = document.getElementById('login-password').value;
  if (!enteredId || !enteredPw) { showLoginError('Please enter your ID and password.'); return; }

  const hash = simpleHash(enteredPw);

  if (currentRole === 'student') {
    const s = DB.students.find(x => x.login_id === enteredId && x.passwordHash === hash);
    if (s) {
      currentUser = { role: 'student', id: enteredId, name: s.name, recordId: s.id };
      logActivity('Login', s.name + ' (Student) signed in');
      navigateTo('student');
    } else { showLoginError('Invalid Student ID or password.'); }

  } else if (currentRole === 'driver') {
    const d = DB.drivers.find(x => x.login_id === enteredId && x.passwordHash === hash);
    if (d) {
      currentUser = { role: 'driver', id: enteredId, name: d.name, recordId: d.id };
      logActivity('Login', d.name + ' (Driver) signed in');
      navigateTo('driver');
    } else { showLoginError('Invalid Driver ID or password.'); }

  } else if (currentRole === 'admin') {
    const admin = DB.adminCreds;
    if (admin && admin.id === enteredId && admin.passwordHash === hash) {
      currentUser = { role: 'admin', id: enteredId, name: admin.name, recordId: 'admin' };
      logActivity('Login', 'Administrator signed in');
      navigateTo('admin');
    } else { showLoginError('Invalid Admin ID or password.'); }
  }
});

/* =====================================================================
   NAVIGATION
   ===================================================================== */
function navigateTo(role) {
  ['login-page','student-page','driver-page','admin-page'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.classList.remove('active'); el.style.display = ''; }
  });

  if (role === 'login') {
    const lp = document.getElementById('login-page');
    lp.classList.add('active'); lp.style.display = 'flex';
    document.getElementById('login-id').value = '';
    document.getElementById('login-password').value = '';
    currentUser = null;
    return;
  }

  const page = document.getElementById(role + '-page');
  page.classList.add('active'); page.style.display = 'flex';

  if (role === 'student') initStudentDashboard();
  if (role === 'driver')  initDriverDashboard();
  if (role === 'admin')   initAdminDashboard();
}

function logout() {
  if (currentUser) logActivity('Logout', currentUser.name + ' (' + currentUser.role + ') signed out');
  navigateTo('login');
}

/* =====================================================================
   PANEL SWITCHING
   ===================================================================== */
const panelTitles = {
  's-dashboard': 'My Dashboard', 's-routes': 'All Bus Routes',
  's-help': 'Help & Coordination', 's-password': 'Change Password',
  'd-dashboard': 'My Dashboard', 'd-passengers': 'Passenger List',
  'd-payments': 'Payments & Salary', 'd-password': 'Change Password',
  'a-dashboard': 'Admin Dashboard', 'a-reg-student': 'Register Student',
  'a-students': 'All Students', 'a-reg-driver': 'Register Driver',
  'a-drivers': 'All Drivers', 'a-credentials': 'Credentials & Reset',
  'a-activity': 'Activity Log',
};

const navIndexMap = {
  's-dashboard': 0, 's-routes': 1, 's-help': 2, 's-password': 3,
  'd-dashboard': 0, 'd-passengers': 1, 'd-payments': 2, 'd-password': 3,
  'a-dashboard': 0, 'a-reg-student': 1, 'a-students': 2,
  'a-reg-driver': 3, 'a-drivers': 4, 'a-credentials': 5, 'a-activity': 6,
};

function showPanel(role, panelId) {
  const page = document.getElementById(role + '-page');
  page.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('panel-' + panelId);
  if (target) target.classList.add('active');

  page.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const navItems = page.querySelectorAll('.nav-item');
  const idx = navIndexMap[panelId];
  if (navItems[idx] !== undefined) navItems[idx].classList.add('active');

  const titleEl = document.getElementById(role + '-page-title');
  if (titleEl) titleEl.textContent = panelTitles[panelId] || '';

  // Refresh panels
  if (panelId === 's-dashboard') renderStudentDashboard();
  if (panelId === 's-routes')    renderAllRoutes();
  if (panelId === 's-help')      renderChatBoard();
  if (panelId === 'd-dashboard') renderDriverDashboard();
  if (panelId === 'd-passengers') renderPassengerList();
  if (panelId === 'd-payments')  renderDriverPayments();
  if (panelId === 'a-dashboard') renderAdminDashboard();
  if (panelId === 'a-students')  renderAdminStudents();
  if (panelId === 'a-drivers')   renderAdminDrivers();
  if (panelId === 'a-credentials') renderCredentials();
  if (panelId === 'a-activity')  renderActivityLog();
  if (panelId === 'a-reg-student') populateBusDropdowns();
  if (panelId === 'a-reg-driver') populateBusDropdowns();

  closeSidebar(role);
  hideAlert('s-pw-success'); hideAlert('s-pw-error');
  hideAlert('d-pw-success'); hideAlert('d-pw-error');
  hideAlert('a-sreg-success'); hideAlert('a-sreg-error');
  hideAlert('a-dreg-success'); hideAlert('a-dreg-error');
}

/* =====================================================================
   SIDEBAR MOBILE
   ===================================================================== */
function openSidebar(role) {
  document.getElementById(role + '-sidebar').classList.add('open');
  document.getElementById(role + '-overlay').classList.add('open');
}
function closeSidebar(role) {
  document.getElementById(role + '-sidebar').classList.remove('open');
  document.getElementById(role + '-overlay').classList.remove('open');
}

/* =====================================================================
   STUDENT MODULE
   ===================================================================== */
function initStudentDashboard() {
  const stu = DB.students.find(s => s.id === currentUser.recordId);
  if (!stu) return;
  const hint = document.getElementById('s-pw-username-hint');
  if (hint) hint.value = stu.login_id;
  document.getElementById('student-sidebar-name').textContent = stu.name;
  document.getElementById('student-sidebar-id').textContent   = 'ID: ' + stu.login_id;
  document.getElementById('student-sidebar-id').textContent   = 'ID: ' + stu.login_id;
  document.getElementById('student-avatar').textContent        = getInitials(stu.name);
  document.getElementById('student-welcome-name').textContent  = 'Welcome, ' + stu.name.split(' ')[0];
  document.getElementById('student-welcome-sub').textContent   = stu.course + ' — ' + (stu.semester || '');
  renderStudentDashboard();
}

function renderStudentDashboard() {
  const stu = DB.students.find(s => s.id === currentUser.recordId);
  if (!stu) return;

  // Profile
  document.getElementById('sp-name').textContent     = stu.name;
  document.getElementById('sp-id').textContent       = stu.login_id;
  document.getElementById('sp-course').textContent   = stu.course;
  document.getElementById('sp-semester').textContent = stu.semester || '---';
  document.getElementById('sp-email').textContent    = stu.email || '---';

  // Bus & Route
  const bus = stu.bus_id ? DB.buses.find(b => b.id === stu.bus_id) : null;
  const noAssign = document.getElementById('s-no-assignment');
  const driverCard = document.getElementById('s-driver-card');

  if (!bus) {
    document.getElementById('sp-bus').textContent         = 'Not Assigned';
    document.getElementById('sp-route').textContent       = 'Not Assigned';
    document.getElementById('sp-pickup').textContent      = '---';
    document.getElementById('sp-pickup-time').textContent = '---';
    noAssign.style.display = 'flex';
    driverCard.style.display = 'none';
  } else {
    noAssign.style.display = 'none';
    driverCard.style.display = 'flex';

    document.getElementById('sp-bus').textContent   = bus.bus_no;
    document.getElementById('sp-route').textContent = bus.route_name;

    // Pickup = first non-drop stop
    const pickup = bus.stops.find(s => !s.drop);
    document.getElementById('sp-pickup').textContent      = pickup ? pickup.point : '---';
    document.getElementById('sp-pickup-time').textContent = pickup ? pickup.time  : '---';

    // Driver
    const driver = bus.driver_id ? DB.drivers.find(d => d.id === bus.driver_id) : null;
    if (driver) {
      document.getElementById('s-driver-avatar').textContent  = getInitials(driver.name);
      document.getElementById('s-driver-name').textContent    = driver.name;
      document.getElementById('s-driver-id').textContent      = driver.login_id;
      document.getElementById('s-driver-phone').textContent   = driver.phone;
    } else {
      document.getElementById('s-driver-name').textContent = 'Not Assigned';
      document.getElementById('s-driver-id').textContent   = '---';
      document.getElementById('s-driver-phone').textContent = '---';
    }
  }
}

/* ALL BUS ROUTES */
function renderAllRoutes() {
  const buses = DB.buses;
  const container = document.getElementById('s-routes-list');
  if (!buses.length) {
    container.innerHTML = '<div class="empty-state" style="padding:60px 0;"><p>No bus routes configured.</p></div>';
    return;
  }
  container.innerHTML = buses.map(bus => {
    const driver = bus.driver_id ? DB.drivers.find(d => d.id === bus.driver_id) : null;
    const stops = bus.stops || [];
    const stopsHtml = stops.map((s, i) => `
      <div class="route-stop-item">
        <div class="route-stop-dot ${s.drop ? 'last' : ''}"></div>
        <div class="route-stop-info">
          <div class="route-stop-name">${escHtml(s.point)}</div>
          <div class="route-stop-time">${escHtml(s.time)}</div>
        </div>
        ${s.drop ? '<span class="badge badge-success" style="font-size:0.7rem;">Drop Point</span>' : ''}
      </div>
    `).join('');
    return `
      <div class="route-card">
        <div class="route-card-header">
          <h4>${escHtml(bus.route_name)}</h4>
          <span class="route-bus-badge">${escHtml(bus.bus_no)}</span>
        </div>
        <div class="route-card-body">
          ${driver ? `<div class="route-driver-tag"><i class="bi bi-person-fill"></i> Driver: ${escHtml(driver.name)} &mdash; ${escHtml(driver.phone)}</div>` : ''}
          <div class="route-stops" style="margin-top:12px;">${stopsHtml}</div>
        </div>
      </div>
    `;
  }).join('');
}

/* =====================================================================
   HELP / COMMUNITY BOARD
   ===================================================================== */
function renderChatBoard() {
  const msgs = DB.chatMessages;
  const board = document.getElementById('chat-board');
  if (!msgs.length) {
    board.innerHTML = `<div class="empty-state" style="padding:40px 0;"><svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg><p>No messages yet. Be the first to post.</p></div>`;
    return;
  }
  board.innerHTML = msgs.map(m => {
    const isOwn = (m.sender_id === currentUser.recordId && m.sender_role === currentUser.role);
    return `
      <div class="chat-message ${isOwn ? 'chat-message-own' : ''}">
        <div class="chat-message-header">
          <div class="chat-message-author">
            <div class="chat-message-avatar">${escHtml(getInitials(m.sender_name))}</div>
            <span class="chat-message-name">${escHtml(m.sender_name)}</span>
          </div>
          <span class="chat-message-time">${timeAgo(m.ts)}</span>
        </div>
        <div class="chat-message-text">${escHtml(m.text)}</div>
      </div>
    `;
  }).join('');
}

function postChatMessage() {
  const inp = document.getElementById('chat-message-input');
  const text = inp.value.trim();
  if (!text) { inp.focus(); return; }
  const msgs = DB.chatMessages;
  msgs.push({
    id: Date.now(),
    sender_id: currentUser.recordId,
    sender_role: currentUser.role,
    sender_name: currentUser.name,
    text,
    ts: Date.now(),
  });
  DB.chatMessages = msgs;
  inp.value = '';
  renderChatBoard();
}
document.getElementById('chat-message-input').addEventListener('keydown', function(e) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); postChatMessage(); }
});

/* =====================================================================
   STUDENT CHANGE PASSWORD
   ===================================================================== */
document.getElementById('s-change-pw-form').addEventListener('submit', function(e) {
  e.preventDefault();
  hideAlert('s-pw-success'); hideAlert('s-pw-error');
  const cur     = document.getElementById('s-pw-current').value;
  const newPw   = document.getElementById('s-pw-new').value;
  const confirm = document.getElementById('s-pw-confirm').value;

  if (!cur || !newPw || !confirm) { showAlert('s-pw-error', 'All fields are required.'); return; }
  if (newPw.length < 6)           { showAlert('s-pw-error', 'New password must be at least 6 characters.'); return; }
  if (newPw !== confirm)          { showAlert('s-pw-error', 'New passwords do not match.'); return; }

  const students = DB.students;
  const idx = students.findIndex(s => s.id === currentUser.recordId);
  if (idx === -1) { showAlert('s-pw-error', 'Account not found.'); return; }

  if (students[idx].passwordHash !== simpleHash(cur)) {
    showAlert('s-pw-error', 'Current password is incorrect.');
    return;
  }
  students[idx].passwordHash = simpleHash(newPw);
  students[idx].pwChanged    = true;
  DB.students = students;
  logActivity('Password Changed', currentUser.name + ' (Student) changed their password');
  showAlert('s-pw-success', 'Password updated successfully. Please use your new password on next login.');
  this.reset();
});

/* =====================================================================
   DRIVER MODULE
   ===================================================================== */
function initDriverDashboard() {
  const drv = DB.drivers.find(d => d.id === currentUser.recordId);
  if (!drv) return;
  document.getElementById('driver-sidebar-name').textContent = drv.name;
  document.getElementById('driver-sidebar-id').textContent   = 'ID: ' + drv.login_id;
  document.getElementById('driver-avatar').textContent        = getInitials(drv.name);
  document.getElementById('driver-welcome-name').textContent  = 'Welcome, ' + drv.name.split(' ')[0];
  renderDriverDashboard();
}

function renderDriverDashboard() {
  const drv = DB.drivers.find(d => d.id === currentUser.recordId);
  if (!drv) return;

  document.getElementById('dp-name').textContent    = drv.name;
  document.getElementById('dp-id').textContent      = drv.login_id;
  document.getElementById('dp-phone').textContent   = drv.phone;
  document.getElementById('dp-license').textContent = drv.license_no;
  document.getElementById('dp-join').textContent    = formatDate(drv.join_date);

  const bus = drv.bus_id ? DB.buses.find(b => b.id === drv.bus_id) : null;
  document.getElementById('dp-bus').textContent = bus ? bus.bus_no : 'Not Assigned';
  document.getElementById('dp-route-name').textContent = bus ? bus.route_name : '---';

  // Stops
  const stopsContainer = document.getElementById('dp-stops-container');
  if (bus && bus.stops && bus.stops.length) {
    stopsContainer.innerHTML = `
      <table class="stops-table">
        <thead><tr><th>#</th><th>Stop / Point</th><th>Time</th><th>Type</th></tr></thead>
        <tbody>
          ${bus.stops.map((s, i) => `
            <tr>
              <td>${i + 1}</td>
              <td style="font-weight:600;color:var(--navy);">${escHtml(s.point)}</td>
              <td>${escHtml(s.time)}</td>
              <td>${s.drop ? '<span class="badge badge-success">Drop</span>' : '<span class="badge badge-info">Pickup</span>'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } else {
    stopsContainer.innerHTML = '<p style="color:var(--gray-400);font-size:0.85rem;">No route stops configured.</p>';
  }

  // Occupancy
  if (bus) {
    const passengers = DB.students.filter(s => s.bus_id === bus.id);
    const total  = bus.total_seats || 40;
    const filled = passengers.length;
    const pct    = Math.min(100, Math.round((filled / total) * 100));
    document.getElementById('dp-occ-text').textContent = filled + ' / ' + total + ' seats occupied';
    document.getElementById('dp-occ-pct').textContent  = pct + '%';
    document.getElementById('dp-occ-bar').style.width  = pct + '%';
  }
}

function renderPassengerList() {
  const drv = DB.drivers.find(d => d.id === currentUser.recordId);
  const bus = drv && drv.bus_id ? DB.buses.find(b => b.id === drv.bus_id) : null;

  document.getElementById('d-pass-bus-label').textContent = bus ? 'Bus ' + bus.bus_no : 'Your Bus';

  const passengers = bus ? DB.students.filter(s => s.bus_id === bus.id) : [];
  document.getElementById('d-pass-count').textContent = passengers.length + ' passenger' + (passengers.length !== 1 ? 's' : '');

  const tbody = document.getElementById('d-passenger-tbody');
  if (!passengers.length) {
    tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state" style="padding:36px 0;"><p>No passengers assigned to this bus.</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = passengers.map((s, i) => {
    // Find pickup = first non-drop stop of the bus
    const pickup = bus && bus.stops ? bus.stops.find(st => !st.drop) : null;
    return `
      <tr>
        <td><span class="badge badge-navy">${i + 1}</span></td>
        <td>
          <div style="display:flex;align-items:center;gap:10px;">
            <div class="avatar">${escHtml(getInitials(s.name))}</div>
            <div>
              <div class="td-name">${escHtml(s.name)}</div>
              <div style="font-size:0.75rem;color:var(--gray-400);">${escHtml(s.login_id)}</div>
            </div>
          </div>
        </td>
        <td>${escHtml(s.course)}</td>
        <td>${pickup ? escHtml(pickup.point) : '---'}</td>
        <td>${pickup ? escHtml(pickup.time)  : '---'}</td>
      </tr>
    `;
  }).join('');
}

function renderDriverPayments() {
  const drv = DB.drivers.find(d => d.id === currentUser.recordId);
  if (!drv) return;

  document.getElementById('dp-salary').textContent = drv.salary ? 'Rs. ' + drv.salary.toLocaleString('en-IN') : '---';

  const payments = JSON.parse(localStorage.getItem('cgc2_pay_' + drv.id) || '[]');
  const lastPay = payments.length ? payments[payments.length - 1] : null;
  document.getElementById('dp-last-payment-status').textContent = lastPay ? lastPay.status : '---';

  const tbody = document.getElementById('d-payment-tbody');
  if (!payments.length) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:32px;color:var(--gray-400);">No payment records found.</td></tr>`;
    return;
  }
  tbody.innerHTML = payments.map(p => `
    <tr>
      <td style="font-weight:600;color:var(--navy);">${escHtml(p.month)}</td>
      <td>Rs. ${Number(p.amount).toLocaleString('en-IN')}</td>
      <td><span class="${p.status === 'Paid' ? 'pay-status-paid' : 'pay-status-pending'}">${escHtml(p.status)}</span></td>
      <td>${p.date_paid ? escHtml(p.date_paid) : '---'}</td>
      <td>
        ${p.status === 'Paid'
          ? `<button class="btn btn-success btn-sm" onclick="downloadReceipt('${escHtml(p.month)}', ${p.amount})">
               <svg viewBox="0 0 24 24" style="width:13px;height:13px;fill:currentColor;"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
               Receipt
             </button>`
          : '<span style="color:var(--gray-400);font-size:0.8rem;">Not available</span>'}
      </td>
    </tr>
  `).join('');
}

function downloadReceipt(month, amount) {
  const drv = DB.drivers.find(d => d.id === currentUser.recordId);
  const content = [
    '================================================',
    '   CGC UNIVERSITY TRANSPORT MANAGEMENT SYSTEM',
    '================================================',
    '',
    'SALARY RECEIPT',
    '',
    'Driver Name  : ' + (drv ? drv.name : ''),
    'Driver ID    : ' + (drv ? drv.login_id : ''),
    'Month        : ' + month,
    'Amount Paid  : Rs. ' + Number(amount).toLocaleString('en-IN'),
    'Status       : PAID',
    '',
    'Generated    : ' + new Date().toLocaleString('en-IN'),
    '================================================',
    '  CGC University, Sector 112, Mohali, Punjab',
    '  transport@cgc.edu.in',
    '================================================',
  ].join('\n');

  const blob = new Blob([content], { type: 'text/plain' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'Receipt_' + month.replace(' ', '_') + '.txt';
  a.click();
  URL.revokeObjectURL(url);
}

/* =====================================================================
   DRIVER CHANGE PASSWORD
   ===================================================================== */
document.getElementById('d-change-pw-form').addEventListener('submit', function(e) {
  e.preventDefault();
  hideAlert('d-pw-success'); hideAlert('d-pw-error');
  const cur     = document.getElementById('d-pw-current').value;
  const newPw   = document.getElementById('d-pw-new').value;
  const confirm = document.getElementById('d-pw-confirm').value;

  if (!cur || !newPw || !confirm) { showAlert('d-pw-error', 'All fields are required.'); return; }
  if (newPw.length < 6)           { showAlert('d-pw-error', 'New password must be at least 6 characters.'); return; }
  if (newPw !== confirm)          { showAlert('d-pw-error', 'New passwords do not match.'); return; }

  const drivers = DB.drivers;
  const idx = drivers.findIndex(d => d.id === currentUser.recordId);
  if (idx === -1) { showAlert('d-pw-error', 'Account not found.'); return; }

  if (drivers[idx].passwordHash !== simpleHash(cur)) {
    showAlert('d-pw-error', 'Current password is incorrect.');
    return;
  }
  drivers[idx].passwordHash = simpleHash(newPw);
  drivers[idx].pwChanged    = true;
  DB.drivers = drivers;
  logActivity('Password Changed', currentUser.name + ' (Driver) changed their password');
  showAlert('d-pw-success', 'Password updated successfully.');
  this.reset();
});

/* =====================================================================
   ADMIN MODULE
   ===================================================================== */
function initAdminDashboard() {
  populateBusDropdowns();
  renderAdminDashboard();
}

function renderAdminDashboard() {
  const students = DB.students;
  const drivers  = DB.drivers;
  const buses    = DB.buses;
  const logs     = DB.activityLog;

  document.getElementById('admin-student-count').textContent  = students.length;
  document.getElementById('admin-driver-count').textContent   = drivers.length;
  document.getElementById('admin-bus-count').textContent      = buses.length;
  document.getElementById('admin-activity-count').textContent = logs.length;

  // Recent students
  const rsTbody = document.getElementById('admin-recent-students');
  const recentS = students.slice(-5).reverse();
  rsTbody.innerHTML = recentS.length
    ? recentS.map((s, i) => `
        <tr>
          <td><span class="badge badge-navy" style="font-size:0.7rem;">${i+1}</span></td>
          <td class="td-name">${escHtml(s.name)}</td>
          <td>${busLabel(s.bus_id)}</td>
        </tr>`).join('')
    : `<tr><td colspan="3"><div class="empty-state" style="padding:20px 0;"><p>No data</p></div></td></tr>`;

  // Recent drivers
  const rdTbody = document.getElementById('admin-recent-drivers');
  const recentD = drivers.slice(-5).reverse();
  rdTbody.innerHTML = recentD.length
    ? recentD.map((d, i) => `
        <tr>
          <td><span class="badge badge-navy" style="font-size:0.7rem;">${i+1}</span></td>
          <td class="td-name">${escHtml(d.name)}</td>
          <td><span class="badge badge-success" style="font-size:0.72rem;">${escHtml(d.license_no)}</span></td>
        </tr>`).join('')
    : `<tr><td colspan="3"><div class="empty-state" style="padding:20px 0;"><p>No data</p></div></td></tr>`;
}

function busLabel(busId) {
  if (!busId) return '<span style="color:var(--gray-400);font-size:0.8rem;">Unassigned</span>';
  const bus = DB.buses.find(b => b.id === busId);
  return bus ? `<span class="badge badge-maroon">${escHtml(bus.bus_no)}</span>` : '---';
}

/* Admin Register Student */
function populateBusDropdowns() {
  const buses = DB.buses;
  const opts  = `<option value="">Select Bus</option>` + buses.map(b => `<option value="${b.id}">${escHtml(b.bus_no)} — ${escHtml(b.route_name)}</option>`).join('');
  ['a-sreg-bus','a-dreg-bus'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = opts;
  });
}

document.getElementById('a-student-reg-form').addEventListener('submit', function(e) {
  e.preventDefault();
  hideAlert('a-sreg-success'); hideAlert('a-sreg-error');
  const name     = document.getElementById('a-sreg-name').value.trim();
  const email    = document.getElementById('a-sreg-email').value.trim();
  const password = document.getElementById('a-sreg-password').value;
  const course   = document.getElementById('a-sreg-course').value.trim();
  const semester = document.getElementById('a-sreg-semester').value;
  const bus_id   = parseInt(document.getElementById('a-sreg-bus').value) || null;

  if (!name || !email || !password || !course || !semester) {
    showAlert('a-sreg-error', 'All fields except Bus are required.');
    return;
  }
  if (password.length < 6) { showAlert('a-sreg-error', 'Password must be at least 6 characters.'); return; }

  const students = DB.students;
  // Auto-generate login_id
  const loginId  = 'STU' + String(nextId(students)).padStart(3, '0');

  const newStu = {
    id: nextId(students), name, email, course, semester, bus_id,
    login_id: loginId,
    passwordHash: simpleHash(password),
    pwChanged: false,
    created_at: Date.now(),
  };
  students.push(newStu);
  DB.students = students;
  logActivity('Student Registered', `${name} (${loginId}) registered by Admin. Bus: ${busLabel(bus_id).replace(/<[^>]+>/g,'')}`);
  showAlert('a-sreg-success', `Student "${name}" registered. Login ID: ${loginId}. Please share credentials securely.`);
  this.reset();
});

function resetAdminStudentForm() {
  document.getElementById('a-student-reg-form').reset();
  hideAlert('a-sreg-success'); hideAlert('a-sreg-error');
}

document.getElementById('a-driver-reg-form').addEventListener('submit', function(e) {
  e.preventDefault();
  hideAlert('a-dreg-success'); hideAlert('a-dreg-error');
  const name      = document.getElementById('a-dreg-name').value.trim();
  const phone     = document.getElementById('a-dreg-phone').value.trim();
  const license   = document.getElementById('a-dreg-license').value.trim();
  const password  = document.getElementById('a-dreg-password').value;
  const bus_id    = parseInt(document.getElementById('a-dreg-bus').value) || null;
  const salary    = parseInt(document.getElementById('a-dreg-salary').value) || 0;

  if (!name || !phone || !license || !password) {
    showAlert('a-dreg-error', 'Name, Phone, License, and Password are required.');
    return;
  }
  if (password.length < 6) { showAlert('a-dreg-error', 'Password must be at least 6 characters.'); return; }

  const drivers = DB.drivers;
  if (drivers.find(d => d.license_no.toLowerCase() === license.toLowerCase())) {
    showAlert('a-dreg-error', 'A driver with this license number already exists.');
    return;
  }

  const loginId = 'DRV' + String(nextId(drivers)).padStart(3, '0');
  const newDrv  = {
    id: nextId(drivers), name, phone, license_no: license, bus_id, salary,
    login_id: loginId,
    passwordHash: simpleHash(password),
    pwChanged: false,
    join_date: Date.now(),
    created_at: Date.now(),
  };
  drivers.push(newDrv);
  DB.drivers = drivers;

  // Seed empty payment history
  localStorage.setItem('cgc2_pay_' + newDrv.id, JSON.stringify([]));

  logActivity('Driver Registered', `${name} (${loginId}) registered by Admin`);
  showAlert('a-dreg-success', `Driver "${name}" registered. Login ID: ${loginId}. Please share credentials securely.`);
  this.reset();
});

function resetAdminDriverForm() {
  document.getElementById('a-driver-reg-form').reset();
  hideAlert('a-dreg-success'); hideAlert('a-dreg-error');
}

/* Admin — All Students */
function renderAdminStudents() {
  const q = (document.getElementById('admin-student-search')?.value || '').toLowerCase().trim();
  let students = DB.students;
  if (q) students = students.filter(s =>
    s.name.toLowerCase().includes(q) ||
    s.course.toLowerCase().includes(q) ||
    (s.login_id || '').toLowerCase().includes(q)
  );

  document.getElementById('admin-student-count-label').textContent =
    students.length + ' record' + (students.length !== 1 ? 's' : '');

  const tbody = document.getElementById('admin-student-tbody');
  if (!students.length) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state" style="padding:40px 0;"><p>${q ? 'No results found.' : 'No students registered yet.'}</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = students.map((s, i) => `
    <tr>
      <td><span class="badge badge-navy">${escHtml(s.login_id)}</span></td>
      <td>
        <div style="display:flex;align-items:center;gap:10px;">
          <div class="avatar">${escHtml(getInitials(s.name))}</div>
          <div>
            <div class="td-name">${escHtml(s.name)}</div>
            <div style="font-size:0.75rem;color:var(--gray-400);">${escHtml(s.email)}</div>
          </div>
        </div>
      </td>
      <td>${escHtml(s.course)}</td>
      <td>${escHtml(s.semester || '---')}</td>
      <td>${busLabel(s.bus_id)}</td>
      <td>
        <button class="btn btn-danger btn-sm" onclick="deleteStudent(${s.id})">
          <svg viewBox="0 0 24 24" style="width:13px;height:13px;fill:currentColor;"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
          Delete
        </button>
      </td>
    </tr>
  `).join('');
}

function adminSearchStudents() { renderAdminStudents(); }

function deleteStudent(id) {
  const students = DB.students;
  const found = students.find(s => s.id === id);
  if (!found) return;
  if (!confirm(`Delete student "${found.name}"? This cannot be undone.`)) return;
  DB.students = students.filter(s => s.id !== id);
  logActivity('Student Deleted', found.name + ' (' + found.login_id + ') removed by Admin');
  renderAdminStudents();
  renderAdminDashboard();
}

/* Admin — All Drivers */
function renderAdminDrivers() {
  const drivers = DB.drivers;
  document.getElementById('admin-driver-count-label').textContent =
    drivers.length + ' record' + (drivers.length !== 1 ? 's' : '');

  const tbody = document.getElementById('admin-driver-tbody');
  if (!drivers.length) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state" style="padding:40px 0;"><p>No drivers registered yet.</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = drivers.map(d => `
    <tr>
      <td><span class="badge badge-navy">${escHtml(d.login_id)}</span></td>
      <td>
        <div style="display:flex;align-items:center;gap:10px;">
          <div class="avatar" style="background:linear-gradient(135deg,var(--maroon-dark),var(--maroon));">${escHtml(getInitials(d.name))}</div>
          <span class="td-name">${escHtml(d.name)}</span>
        </div>
      </td>
      <td>${escHtml(d.phone)}</td>
      <td><span class="badge badge-success">${escHtml(d.license_no)}</span></td>
      <td>${busLabel(d.bus_id)}</td>
      <td>
        <button class="btn btn-danger btn-sm" onclick="deleteDriver(${d.id})">
          <svg viewBox="0 0 24 24" style="width:13px;height:13px;fill:currentColor;"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
          Delete
        </button>
      </td>
    </tr>
  `).join('');
}

function deleteDriver(id) {
  const drivers = DB.drivers;
  const found = drivers.find(d => d.id === id);
  if (!found) return;
  if (!confirm(`Delete driver "${found.name}"? This cannot be undone.`)) return;
  DB.drivers = drivers.filter(d => d.id !== id);
  logActivity('Driver Deleted', found.name + ' (' + found.login_id + ') removed by Admin');
  renderAdminDrivers();
  renderAdminDashboard();
}

/* =====================================================================
   CREDENTIALS & PASSWORD RESET (Admin)
   ===================================================================== */
function renderCredentials() {
  // Students
  const sTbody = document.getElementById('cred-student-tbody');
  const students = DB.students;
  sTbody.innerHTML = students.length
    ? students.map(s => `
        <tr>
          <td><span class="badge badge-navy" style="font-size:0.72rem;">${escHtml(s.login_id)}</span></td>
          <td class="td-name">${escHtml(s.name)}</td>
          <td class="${s.pwChanged ? 'pw-changed-yes' : 'pw-changed-no'}">${s.pwChanged ? 'Yes' : 'Default'}</td>
          <td>
            <button class="btn btn-secondary btn-sm" onclick="openResetModal('student', ${s.id})">Reset PW</button>
          </td>
        </tr>`).join('')
    : `<tr><td colspan="4" style="text-align:center;padding:24px;color:var(--gray-400);">No students.</td></tr>`;

  // Drivers
  const dTbody = document.getElementById('cred-driver-tbody');
  const drivers = DB.drivers;
  dTbody.innerHTML = drivers.length
    ? drivers.map(d => `
        <tr>
          <td><span class="badge badge-navy" style="font-size:0.72rem;">${escHtml(d.login_id)}</span></td>
          <td class="td-name">${escHtml(d.name)}</td>
          <td class="${d.pwChanged ? 'pw-changed-yes' : 'pw-changed-no'}">${d.pwChanged ? 'Yes' : 'Default'}</td>
          <td>
            <button class="btn btn-secondary btn-sm" onclick="openResetModal('driver', ${d.id})">Reset PW</button>
          </td>
        </tr>`).join('')
    : `<tr><td colspan="4" style="text-align:center;padding:24px;color:var(--gray-400);">No drivers.</td></tr>`;
}

/* Reset Modal */
let resetTarget = { type: null, id: null };

function openResetModal(type, id) {
  resetTarget = { type, id };
  const arr  = type === 'student' ? DB.students : DB.drivers;
  const rec  = arr.find(x => x.id === id);
  if (!rec) return;
  document.getElementById('reset-modal-title').textContent    = 'Reset Password — ' + rec.name;
  document.getElementById('reset-modal-subtitle').textContent = 'Admin resetting password for ' + rec.name + ' (' + rec.login_id + ')';
  document.getElementById('reset-new-pw').value = '';
  hideAlert('reset-success'); hideAlert('reset-error');
  document.getElementById('reset-modal').style.display = 'flex';
}

function closeResetModal(e) {
  if (e && e.target !== document.getElementById('reset-modal') && e !== undefined && e.target) return;
  document.getElementById('reset-modal').style.display = 'none';
  resetTarget = { type: null, id: null };
}

function confirmReset() {
  hideAlert('reset-success'); hideAlert('reset-error');
  const newPw = document.getElementById('reset-new-pw').value.trim();
  if (!newPw || newPw.length < 6) { showAlert('reset-error', 'Password must be at least 6 characters.'); return; }

  const { type, id } = resetTarget;
  if (type === 'student') {
    const students = DB.students;
    const idx = students.findIndex(s => s.id === id);
    if (idx === -1) { showAlert('reset-error', 'Student not found.'); return; }
    logActivity('Password Reset', `Admin reset password for ${students[idx].name} (Student)`);
    students[idx].passwordHash = simpleHash(newPw);
    students[idx].pwChanged    = false; // Reset to "Default" status after admin reset
    DB.students = students;
  } else {
    const drivers = DB.drivers;
    const idx = drivers.findIndex(d => d.id === id);
    if (idx === -1) { showAlert('reset-error', 'Driver not found.'); return; }
    logActivity('Password Reset', `Admin reset password for ${drivers[idx].name} (Driver)`);
    drivers[idx].passwordHash = simpleHash(newPw);
    drivers[idx].pwChanged    = false;
    DB.drivers = drivers;
  }
  showAlert('reset-success', 'Password has been reset successfully. Please communicate the new password securely.');
  renderCredentials();
}

// Close modal when clicking outside
document.getElementById('reset-modal').addEventListener('click', function(e) {
  if (e.target === this) { this.style.display = 'none'; resetTarget = { type: null, id: null }; }
});

/* =====================================================================
   ACTIVITY LOG
   ===================================================================== */
function renderActivityLog() {
  const logs = DB.activityLog;
  const body = document.getElementById('activity-log-body');
  if (!logs.length) {
    body.innerHTML = `<div class="empty-state" style="padding:48px 0;"><svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/></svg><p>No activity recorded yet.</p></div>`;
    return;
  }
  const colorMap = {
    'Login': 'var(--info)', 'Logout': 'var(--gray-400)',
    'Student Registered': 'var(--success)', 'Student Deleted': 'var(--danger)',
    'Driver Registered': 'var(--success)', 'Driver Deleted': 'var(--danger)',
    'Password Changed': 'var(--warning)', 'Password Reset': 'var(--maroon)',
    'System': 'var(--navy)',
  };
  body.innerHTML = '<div>' + logs.map(entry => `
    <div class="activity-log-item">
      <div class="activity-log-dot" style="background:${colorMap[entry.action] || 'var(--gray-300)'};"></div>
      <div style="flex:1;">
        <div class="activity-log-action">${escHtml(entry.action)}</div>
        <div class="activity-log-detail">${escHtml(entry.details)}</div>
      </div>
      <div class="activity-log-time">${timeAgo(entry.ts)}</div>
    </div>
  `).join('') + '</div>';
}

function clearLog() {
  if (!confirm('Clear all activity logs?')) return;
  DB.activityLog = [];
  renderActivityLog();
  renderAdminDashboard();
}

/* =====================================================================
   RESPONSIVE ADMIN GRID
   ===================================================================== */
function applyResponsiveGrids() {
  const adminGrid = document.querySelector('.admin-tables-grid');
  if (adminGrid) adminGrid.style.gridTemplateColumns = window.innerWidth < 900 ? '1fr' : '1fr 1fr';
  const credGrid = document.querySelector('.cred-grid');
  if (credGrid) credGrid.style.gridTemplateColumns = window.innerWidth < 1024 ? '1fr' : '1fr 1fr';
}
window.addEventListener('resize', applyResponsiveGrids);
applyResponsiveGrids();

/* =====================================================================
   INIT
   ===================================================================== */
seedAll();