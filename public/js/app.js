/* ============================================================
   CGC University Transport Management System - Application JS
   ============================================================ */

'use strict';

/* ===================== DATA STORE ===================== */
const DB = {
  // Credentials
  credentials: {
    student: { id: 'STU001', password: 'student123', name: 'Arjun Sharma' },
    driver:  { id: 'DRV001', password: 'driver123',  name: 'Rajinder Singh' },
    admin:   { id: 'ADMIN01', password: 'admin123',  name: 'Administrator' }
  },

  // Persistent data (localStorage)
  get students() { return JSON.parse(localStorage.getItem('cgc_students') || '[]'); },
  set students(v) { localStorage.setItem('cgc_students', JSON.stringify(v)); },

  get drivers() { return JSON.parse(localStorage.getItem('cgc_drivers') || '[]'); },
  set drivers(v) { localStorage.setItem('cgc_drivers', JSON.stringify(v)); },

  get activityLog() { return JSON.parse(localStorage.getItem('cgc_activity') || '[]'); },
  set activityLog(v) { localStorage.setItem('cgc_activity', JSON.stringify(v)); },
};

/* ===================== APP STATE ===================== */
let currentRole = 'student';
let currentUser = null;
let nextStudentId = () => {
  const s = DB.students;
  return s.length > 0 ? Math.max(...s.map(x => x.id)) + 1 : 1;
};
let nextDriverId = () => {
  const d = DB.drivers;
  return d.length > 0 ? Math.max(...d.map(x => x.id)) + 1 : 1;
};

/* ===================== UTILITY ===================== */
function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2);
}

function timeAgo(ts) {
  const diff = Date.now() - ts;
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
  if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
  return new Date(ts).toLocaleDateString('en-IN');
}

function log(action, details) {
  const logs = DB.activityLog;
  logs.unshift({ id: Date.now(), action, details, ts: Date.now() });
  if (logs.length > 100) logs.pop();
  DB.activityLog = logs;
}

/* ===================== LOGIN ===================== */

// Set active role tab
function setRole(role) {
  currentRole = role;

  // Update tab styles
  document.querySelectorAll('.role-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.role === role);
  });

  // Update placeholder
  const labels = { student: 'Student ID', driver: 'Driver ID', admin: 'Admin ID' };
  const placeholders = { student: 'Enter Student ID', driver: 'Enter Driver ID', admin: 'Enter Admin ID' };
  document.getElementById('id-label').textContent = labels[role];
  document.getElementById('login-id').placeholder = placeholders[role];

  // Clear error
  hideLoginError();
}

function showLoginError(msg) {
  const el = document.getElementById('login-error');
  document.getElementById('login-error-text').textContent = msg;
  el.classList.add('show');
}

function hideLoginError() {
  document.getElementById('login-error').classList.remove('show');
}

function togglePassword() {
  const input = document.getElementById('login-password');
  const icon = document.getElementById('eye-icon');
  if (input.type === 'password') {
    input.type = 'text';
    icon.className = 'bi bi-eye-slash';
  } else {
    input.type = 'password';
    icon.className = 'bi bi-eye';
  }
}

// Login form submit
document.getElementById('login-form').addEventListener('submit', function (e) {
  e.preventDefault();
  hideLoginError();

  const enteredId = document.getElementById('login-id').value.trim();
  const enteredPw = document.getElementById('login-password').value;

  if (!enteredId || !enteredPw) {
    showLoginError('Please enter your ID and password.');
    return;
  }

  const cred = DB.credentials[currentRole];

  if (enteredId === cred.id && enteredPw === cred.password) {
    currentUser = { role: currentRole, name: cred.name, id: enteredId };
    log('Login', `${cred.name} (${currentRole}) signed in`);
    navigateTo(currentRole);
  } else {
    showLoginError('Invalid credentials. Please check your ID and password.');
  }
});

/* ===================== NAVIGATION ===================== */

function navigateTo(role) {
  // Hide all pages
  document.getElementById('login-page').classList.remove('active');
  document.getElementById('student-page').classList.remove('active');
  document.getElementById('driver-page').classList.remove('active');
  document.getElementById('admin-page').classList.remove('active');

  if (role === 'login') {
    document.getElementById('login-page').classList.add('active');
    document.getElementById('login-id').value = '';
    document.getElementById('login-password').value = '';
    currentUser = null;
    return;
  }

  document.getElementById(role + '-page').classList.add('active');

  if (role === 'student') initStudentDashboard();
  if (role === 'driver') initDriverDashboard();
  if (role === 'admin') initAdminDashboard();
}

function logout() {
  if (currentUser) {
    log('Logout', `${currentUser.name} (${currentUser.role}) signed out`);
  }
  navigateTo('login');
}

/* ===================== PANEL SWITCHING ===================== */

function showPanel(role, panelId) {
  // Deactivate all panels in the role
  const page = document.getElementById(role + '-page');
  page.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.getElementById('panel-' + panelId).classList.add('active');

  // Update nav active state
  page.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const navMap = {
    's-dashboard': 0, 's-register': 1, 's-list': 2, 's-search': 3,
    'd-dashboard': 0, 'd-register': 1, 'd-list': 2,
    'a-dashboard': 0, 'a-students': 1, 'a-drivers': 2, 'a-activity': 3
  };
  const navItems = page.querySelectorAll('.nav-item');
  if (navItems[navMap[panelId]]) navItems[navMap[panelId]].classList.add('active');

  // Update topbar title
  const titles = {
    's-dashboard': 'Student Dashboard', 's-register': 'Register Student',
    's-list': 'Student List', 's-search': 'Search Students',
    'd-dashboard': 'Driver Dashboard', 'd-register': 'Register Driver',
    'd-list': 'Driver List',
    'a-dashboard': 'Admin Dashboard', 'a-students': 'Manage Students',
    'a-drivers': 'Manage Drivers', 'a-activity': 'Activity Log'
  };
  const titleEl = document.getElementById(role + '-page-title');
  if (titleEl) titleEl.textContent = titles[panelId] || '';

  // Refresh data
  if (panelId === 's-dashboard') renderStudentDashboard();
  if (panelId === 's-list') renderStudentList();
  if (panelId === 's-search') {
    document.getElementById('search-input').value = '';
    renderSearchTable([]);
    document.getElementById('search-count-label').textContent = 'Type to search';
  }
  if (panelId === 'd-dashboard') renderDriverDashboard();
  if (panelId === 'd-list') renderDriverList();
  if (panelId === 'a-dashboard') renderAdminDashboard();
  if (panelId === 'a-students') renderAdminStudents();
  if (panelId === 'a-drivers') renderAdminDrivers();
  if (panelId === 'a-activity') renderActivityLog();

  // Close mobile sidebar
  closeSidebar(role);
}

/* ===================== SIDEBAR MOBILE ===================== */
function openSidebar(role) {
  document.getElementById(role + '-sidebar').classList.add('open');
  document.getElementById(role + '-overlay').classList.add('open');
}

function closeSidebar(role) {
  document.getElementById(role + '-sidebar').classList.remove('open');
  document.getElementById(role + '-overlay').classList.remove('open');
}

/* ===================== STUDENT MODULE ===================== */

function initStudentDashboard() {
  if (currentUser) {
    document.getElementById('student-sidebar-name').textContent = currentUser.name;
    document.getElementById('student-avatar').textContent = getInitials(currentUser.name);
    document.getElementById('student-welcome-name').textContent = 'Welcome, ' + currentUser.name.split(' ')[0];
  }
  renderStudentDashboard();
}

function renderStudentDashboard() {
  const students = DB.students;
  const drivers = DB.drivers;
  const busNos = [...new Set(students.map(s => s.bus_no).filter(Boolean))];

  document.getElementById('dash-student-total').textContent = students.length;
  document.getElementById('dash-bus-total').textContent = busNos.length;
  document.getElementById('dash-driver-total').textContent = drivers.length;

  // Recent 5 students
  const recent = students.slice(-5).reverse();
  const tbody = document.getElementById('recent-students-tbody');
  if (recent.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state" style="padding:30px 0;"><p>No students registered yet.</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = recent.map((s, i) => `
    <tr>
      <td><span class="badge badge-navy">STU-${String(s.id).padStart(3,'0')}</span></td>
      <td>
        <div style="display:flex;align-items:center;gap:10px;">
          <div class="avatar">${getInitials(s.name)}</div>
          <span class="td-name">${escHtml(s.name)}</span>
        </div>
      </td>
      <td>${escHtml(s.course)}</td>
      <td><span class="badge badge-maroon">${escHtml(s.bus_no)}</span></td>
      <td style="color:var(--gray-500);font-size:0.83rem;">${escHtml(s.email)}</td>
    </tr>
  `).join('');
}

// Student Registration Form
document.getElementById('student-reg-form').addEventListener('submit', function (e) {
  e.preventDefault();
  const name = document.getElementById('s-reg-name').value.trim();
  const email = document.getElementById('s-reg-email').value.trim();
  const password = document.getElementById('s-reg-password').value;
  const course = document.getElementById('s-reg-course').value.trim();
  const bus_no = document.getElementById('s-reg-bus').value.trim();

  hideAlert('reg-success');
  hideAlert('reg-error');

  if (!name || !email || !password || !course || !bus_no) {
    showAlert('reg-error', 'All fields are required. Please fill in every field.');
    return;
  }

  const students = DB.students;
  const newStudent = { id: nextStudentId(), name, email, password, course, bus_no, created_at: Date.now() };
  students.push(newStudent);
  DB.students = students;

  log('Student Registered', `${name} enrolled in ${course}, Bus: ${bus_no}`);
  showAlert('reg-success', `Student "${name}" registered successfully with ID STU-${String(newStudent.id).padStart(3,'0')}.`);
  this.reset();
});

function resetStudentForm() {
  document.getElementById('student-reg-form').reset();
  hideAlert('reg-success');
  hideAlert('reg-error');
}

function renderStudentList() {
  const students = DB.students;
  const tbody = document.getElementById('student-list-tbody');
  document.getElementById('student-count-label').textContent = students.length + ' record' + (students.length !== 1 ? 's' : '');

  if (students.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state" style="padding:40px 0;"><p>No students registered yet. <button class="btn btn-primary btn-sm" onclick="showPanel('student','s-register')">Register Now</button></p></div></td></tr>`;
    return;
  }

  tbody.innerHTML = students.map((s, i) => `
    <tr>
      <td><span class="badge badge-navy">STU-${String(s.id).padStart(3,'0')}</span></td>
      <td>
        <div style="display:flex;align-items:center;gap:10px;">
          <div class="avatar">${getInitials(s.name)}</div>
          <div>
            <div class="td-name">${escHtml(s.name)}</div>
            <div style="font-size:0.75rem;color:var(--gray-400);">${escHtml(s.email)}</div>
          </div>
        </div>
      </td>
      <td>${escHtml(s.course)}</td>
      <td><span class="badge badge-maroon">${escHtml(s.bus_no)}</span></td>
      <td style="font-size:0.83rem;color:var(--gray-500);">${escHtml(s.email)}</td>
      <td>
        <button class="btn btn-danger btn-sm" onclick="deleteStudent(${s.id})">
          <svg viewBox="0 0 24 24" style="width:13px;height:13px;fill:currentColor;"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
          Delete
        </button>
      </td>
    </tr>
  `).join('');
}

function deleteStudent(id) {
  const students = DB.students;
  const found = students.find(s => s.id === id);
  if (!found) return;
  if (!confirm(`Delete student "${found.name}"? This action cannot be undone.`)) return;
  DB.students = students.filter(s => s.id !== id);
  log('Student Deleted', `${found.name} removed from system`);
  renderStudentList();
  renderAdminStudents();
  renderAdminDashboard();
}

function searchStudents() {
  const q = document.getElementById('search-input').value.trim().toLowerCase();
  if (!q) {
    renderSearchTable([]);
    document.getElementById('search-count-label').textContent = 'Type to search';
    return;
  }
  const results = DB.students.filter(s =>
    s.name.toLowerCase().includes(q) ||
    s.bus_no.toLowerCase().includes(q) ||
    s.course.toLowerCase().includes(q)
  );
  document.getElementById('search-count-label').textContent = results.length + ' result' + (results.length !== 1 ? 's' : '') + ' found';
  renderSearchTable(results, q);
}

function renderSearchTable(results, query = '') {
  const tbody = document.getElementById('search-tbody');
  if (results.length === 0) {
    const msg = query ? 'No students found matching your search.' : 'Enter a search term to find students.';
    tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state" style="padding:40px 0;"><svg viewBox="0 0 24 24" style="width:40px;height:40px;fill:var(--gray-300);margin-bottom:12px;"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg><p>${msg}</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = results.map((s, i) => `
    <tr>
      <td><span class="badge badge-navy">STU-${String(s.id).padStart(3,'0')}</span></td>
      <td>
        <div style="display:flex;align-items:center;gap:10px;">
          <div class="avatar">${getInitials(s.name)}</div>
          <span class="td-name">${highlight(escHtml(s.name), query)}</span>
        </div>
      </td>
      <td>${escHtml(s.course)}</td>
      <td><span class="badge badge-maroon">${highlight(escHtml(s.bus_no), query)}</span></td>
      <td style="font-size:0.83rem;color:var(--gray-500);">${escHtml(s.email)}</td>
    </tr>
  `).join('');
}

function highlight(text, query) {
  if (!query) return text;
  const re = new RegExp('(' + escRegex(query) + ')', 'gi');
  return text.replace(re, '<mark style="background:rgba(139,26,47,0.15);color:var(--maroon);border-radius:2px;padding:0 2px;">$1</mark>');
}

/* ===================== DRIVER MODULE ===================== */

function initDriverDashboard() {
  if (currentUser) {
    document.getElementById('driver-sidebar-name').textContent = currentUser.name;
    document.getElementById('driver-avatar').textContent = getInitials(currentUser.name);
    document.getElementById('driver-welcome-name').textContent = 'Welcome, ' + currentUser.name.split(' ')[0];
  }
  renderDriverDashboard();
}

function renderDriverDashboard() {
  const drivers = DB.drivers;
  const students = DB.students;
  document.getElementById('d-dash-driver-count').textContent = drivers.length;
  document.getElementById('d-dash-student-count').textContent = students.length;

  const tbody = document.getElementById('d-recent-tbody');
  const recent = drivers.slice(-5).reverse();
  if (recent.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4"><div class="empty-state" style="padding:30px 0;"><p>No drivers registered yet.</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = recent.map(d => `
    <tr>
      <td><span class="badge badge-navy">DRV-${String(d.id).padStart(3,'0')}</span></td>
      <td>
        <div style="display:flex;align-items:center;gap:10px;">
          <div class="avatar" style="background:linear-gradient(135deg,var(--maroon-dark),var(--maroon));">${getInitials(d.name)}</div>
          <span class="td-name">${escHtml(d.name)}</span>
        </div>
      </td>
      <td>${escHtml(d.phone)}</td>
      <td><span class="badge badge-success">${escHtml(d.license_no)}</span></td>
    </tr>
  `).join('');
}

// Driver Registration
document.getElementById('driver-reg-form').addEventListener('submit', function (e) {
  e.preventDefault();
  const name = document.getElementById('d-reg-name').value.trim();
  const phone = document.getElementById('d-reg-phone').value.trim();
  const license_no = document.getElementById('d-reg-license').value.trim();

  hideAlert('d-reg-success');
  hideAlert('d-reg-error');

  if (!name || !phone || !license_no) {
    showAlert('d-reg-error', 'All fields are required. Please fill in every field.');
    return;
  }

  const drivers = DB.drivers;
  const dupLicense = drivers.find(d => d.license_no.toLowerCase() === license_no.toLowerCase());
  if (dupLicense) {
    showAlert('d-reg-error', 'A driver with this license number already exists.');
    return;
  }

  const newDriver = { id: nextDriverId(), name, phone, license_no, created_at: Date.now() };
  drivers.push(newDriver);
  DB.drivers = drivers;

  log('Driver Registered', `${name} registered with license ${license_no}`);
  showAlert('d-reg-success', `Driver "${name}" registered successfully with ID DRV-${String(newDriver.id).padStart(3,'0')}.`);
  this.reset();
});

function resetDriverForm() {
  document.getElementById('driver-reg-form').reset();
  hideAlert('d-reg-success');
  hideAlert('d-reg-error');
}

function renderDriverList() {
  const drivers = DB.drivers;
  const tbody = document.getElementById('driver-list-tbody');
  document.getElementById('driver-count-label').textContent = drivers.length + ' record' + (drivers.length !== 1 ? 's' : '');

  if (drivers.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state" style="padding:40px 0;"><p>No drivers registered yet. <button class="btn btn-primary btn-sm" onclick="showPanel('driver','d-register')">Register Now</button></p></div></td></tr>`;
    return;
  }

  tbody.innerHTML = drivers.map((d, i) => `
    <tr>
      <td><span class="badge badge-navy">DRV-${String(d.id).padStart(3,'0')}</span></td>
      <td>
        <div style="display:flex;align-items:center;gap:10px;">
          <div class="avatar" style="background:linear-gradient(135deg,var(--maroon-dark),var(--maroon));">${getInitials(d.name)}</div>
          <span class="td-name">${escHtml(d.name)}</span>
        </div>
      </td>
      <td>${escHtml(d.phone)}</td>
      <td><span class="badge badge-success">${escHtml(d.license_no)}</span></td>
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
  if (!confirm(`Delete driver "${found.name}"? This action cannot be undone.`)) return;
  DB.drivers = drivers.filter(d => d.id !== id);
  log('Driver Deleted', `${found.name} removed from system`);
  renderDriverList();
  renderAdminDrivers();
  renderAdminDashboard();
}

/* ===================== ADMIN MODULE ===================== */

function initAdminDashboard() {
  renderAdminDashboard();
}

function renderAdminDashboard() {
  const students = DB.students;
  const drivers = DB.drivers;
  const busNos = [...new Set(students.map(s => s.bus_no).filter(Boolean))];
  const logs = DB.activityLog;

  document.getElementById('admin-student-count').textContent = students.length;
  document.getElementById('admin-driver-count').textContent = drivers.length;
  document.getElementById('admin-bus-count').textContent = busNos.length;
  document.getElementById('admin-activity-count').textContent = logs.length;

  // Recent students
  const rsTbody = document.getElementById('admin-recent-students');
  const recentStudents = students.slice(-5).reverse();
  if (recentStudents.length === 0) {
    rsTbody.innerHTML = `<tr><td colspan="3"><div class="empty-state" style="padding:20px 0;"><p>No data</p></div></td></tr>`;
  } else {
    rsTbody.innerHTML = recentStudents.map((s, i) => `
      <tr>
        <td><span class="badge badge-navy" style="font-size:0.7rem;">${i+1}</span></td>
        <td class="td-name">${escHtml(s.name)}</td>
        <td><span class="badge badge-maroon">${escHtml(s.bus_no)}</span></td>
      </tr>
    `).join('');
  }

  // Recent drivers
  const rdTbody = document.getElementById('admin-recent-drivers');
  const recentDrivers = drivers.slice(-5).reverse();
  if (recentDrivers.length === 0) {
    rdTbody.innerHTML = `<tr><td colspan="3"><div class="empty-state" style="padding:20px 0;"><p>No data</p></div></td></tr>`;
  } else {
    rdTbody.innerHTML = recentDrivers.map((d, i) => `
      <tr>
        <td><span class="badge badge-navy" style="font-size:0.7rem;">${i+1}</span></td>
        <td class="td-name">${escHtml(d.name)}</td>
        <td><span class="badge badge-success" style="font-size:0.72rem;">${escHtml(d.license_no)}</span></td>
      </tr>
    `).join('');
  }
}

function renderAdminStudents() {
  const q = (document.getElementById('admin-student-search')?.value || '').toLowerCase().trim();
  let students = DB.students;
  if (q) students = students.filter(s => s.name.toLowerCase().includes(q) || s.bus_no.toLowerCase().includes(q) || s.course.toLowerCase().includes(q));

  document.getElementById('admin-student-count-label').textContent = students.length + ' record' + (students.length !== 1 ? 's' : '');

  const tbody = document.getElementById('admin-student-tbody');
  if (students.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state" style="padding:40px 0;"><p>${q ? 'No students match your search.' : 'No students registered yet.'}</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = students.map((s, i) => `
    <tr>
      <td><span class="badge badge-navy">STU-${String(s.id).padStart(3,'0')}</span></td>
      <td>
        <div style="display:flex;align-items:center;gap:10px;">
          <div class="avatar">${getInitials(s.name)}</div>
          <div>
            <div class="td-name">${escHtml(s.name)}</div>
            <div style="font-size:0.75rem;color:var(--gray-400);">${escHtml(s.email)}</div>
          </div>
        </div>
      </td>
      <td>${escHtml(s.course)}</td>
      <td><span class="badge badge-maroon">${escHtml(s.bus_no)}</span></td>
      <td style="font-size:0.83rem;color:var(--gray-500);">${escHtml(s.email)}</td>
      <td>
        <button class="btn btn-danger btn-sm" onclick="deleteStudentAdmin(${s.id})">
          <svg viewBox="0 0 24 24" style="width:13px;height:13px;fill:currentColor;"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
          Delete
        </button>
      </td>
    </tr>
  `).join('');
}

function adminSearchStudents() {
  renderAdminStudents();
}

function deleteStudentAdmin(id) {
  const students = DB.students;
  const found = students.find(s => s.id === id);
  if (!found) return;
  if (!confirm(`Delete student "${found.name}"? This action cannot be undone.`)) return;
  DB.students = students.filter(s => s.id !== id);
  log('Student Deleted (Admin)', `${found.name} removed by admin`);
  renderAdminStudents();
  renderAdminDashboard();
}

function renderAdminDrivers() {
  const drivers = DB.drivers;
  document.getElementById('admin-driver-count-label').textContent = drivers.length + ' record' + (drivers.length !== 1 ? 's' : '');

  const tbody = document.getElementById('admin-driver-tbody');
  if (drivers.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state" style="padding:40px 0;"><p>No drivers registered yet.</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = drivers.map((d, i) => `
    <tr>
      <td><span class="badge badge-navy">DRV-${String(d.id).padStart(3,'0')}</span></td>
      <td>
        <div style="display:flex;align-items:center;gap:10px;">
          <div class="avatar" style="background:linear-gradient(135deg,var(--maroon-dark),var(--maroon));">${getInitials(d.name)}</div>
          <span class="td-name">${escHtml(d.name)}</span>
        </div>
      </td>
      <td>${escHtml(d.phone)}</td>
      <td><span class="badge badge-success">${escHtml(d.license_no)}</span></td>
      <td>
        <button class="btn btn-danger btn-sm" onclick="deleteDriverAdmin(${d.id})">
          <svg viewBox="0 0 24 24" style="width:13px;height:13px;fill:currentColor;"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
          Delete
        </button>
      </td>
    </tr>
  `).join('');
}

function deleteDriverAdmin(id) {
  const drivers = DB.drivers;
  const found = drivers.find(d => d.id === id);
  if (!found) return;
  if (!confirm(`Delete driver "${found.name}"? This action cannot be undone.`)) return;
  DB.drivers = drivers.filter(d => d.id !== id);
  log('Driver Deleted (Admin)', `${found.name} removed by admin`);
  renderAdminDrivers();
  renderAdminDashboard();
}

function renderActivityLog() {
  const logs = DB.activityLog;
  const body = document.getElementById('activity-log-body');

  if (logs.length === 0) {
    body.innerHTML = `<div class="empty-state" style="padding:48px 0;"><svg viewBox="0 0 24 24" style="width:40px;height:40px;fill:var(--gray-300);margin-bottom:12px;"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg><p>No activity recorded yet.</p></div>`;
    return;
  }

  const colors = {
    'Login': 'var(--info)',
    'Logout': 'var(--gray-400)',
    'Student Registered': 'var(--success)',
    'Student Deleted': 'var(--danger)',
    'Student Deleted (Admin)': 'var(--danger)',
    'Driver Registered': 'var(--success)',
    'Driver Deleted': 'var(--danger)',
    'Driver Deleted (Admin)': 'var(--danger)',
  };

  body.innerHTML = `<div style="padding:8px 0;">` + logs.map(entry => `
    <div style="display:flex;align-items:flex-start;gap:14px;padding:14px 24px;border-bottom:1px solid var(--gray-100);">
      <div style="width:8px;height:8px;border-radius:50%;background:${colors[entry.action] || 'var(--gray-300)'};margin-top:6px;flex-shrink:0;"></div>
      <div style="flex:1;">
        <div style="font-size:0.875rem;font-weight:600;color:var(--navy);">${escHtml(entry.action)}</div>
        <div style="font-size:0.8rem;color:var(--gray-500);margin-top:2px;">${escHtml(entry.details)}</div>
      </div>
      <div style="font-size:0.75rem;color:var(--gray-400);white-space:nowrap;">${timeAgo(entry.ts)}</div>
    </div>
  `).join('') + `</div>`;
}

function clearLog() {
  if (!confirm('Clear all activity logs? This cannot be undone.')) return;
  DB.activityLog = [];
  renderActivityLog();
  renderAdminDashboard();
}

/* ===================== ALERT HELPERS ===================== */
function showAlert(id, msg) {
  const el = document.getElementById(id);
  if (el) { el.textContent = msg; el.classList.add('show'); }
}

function hideAlert(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('show');
}

/* ===================== SECURITY HELPERS ===================== */
function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/* ===================== RESPONSIVE ADMIN GRID ===================== */
function applyResponsiveAdminGrid() {
  const grid = document.querySelector('.admin-tables-grid');
  if (!grid) return;
  if (window.innerWidth < 768) {
    grid.style.gridTemplateColumns = '1fr';
  } else {
    grid.style.gridTemplateColumns = '1fr 1fr';
  }
}

window.addEventListener('resize', applyResponsiveAdminGrid);
applyResponsiveAdminGrid();

/* ===================== SEED DATA (Demo) ===================== */
function seedDemoData() {
  if (DB.students.length === 0) {
    DB.students = [
      { id: 1, name: 'Arjun Sharma', email: 'arjun@cgc.edu.in', password: 'pass', course: 'B.Tech CSE', bus_no: 'CGC-07', created_at: Date.now() - 86400000 * 5 },
      { id: 2, name: 'Priya Kaur', email: 'priya@cgc.edu.in', password: 'pass', course: 'BCA', bus_no: 'CGC-03', created_at: Date.now() - 86400000 * 4 },
      { id: 3, name: 'Rohit Verma', email: 'rohit@cgc.edu.in', password: 'pass', course: 'MBA', bus_no: 'CGC-07', created_at: Date.now() - 86400000 * 3 },
      { id: 4, name: 'Simran Grewal', email: 'simran@cgc.edu.in', password: 'pass', course: 'B.Tech ECE', bus_no: 'CGC-12', created_at: Date.now() - 86400000 * 2 },
      { id: 5, name: 'Manpreet Singh', email: 'manpreet@cgc.edu.in', password: 'pass', course: 'BBA', bus_no: 'CGC-03', created_at: Date.now() - 86400000 },
    ];
  }
  if (DB.drivers.length === 0) {
    DB.drivers = [
      { id: 1, name: 'Rajinder Singh', phone: '+91 98765 43210', license_no: 'PB-0520220001', created_at: Date.now() - 86400000 * 7 },
      { id: 2, name: 'Gurjeet Dhaliwal', phone: '+91 87654 32109', license_no: 'PB-0520220002', created_at: Date.now() - 86400000 * 6 },
      { id: 3, name: 'Harpreet Sandhu', phone: '+91 76543 21098', license_no: 'PB-0520220003', created_at: Date.now() - 86400000 * 3 },
    ];
  }
  if (DB.activityLog.length === 0) {
    log('System', 'CGC University TMS initialized with demo data');
  }
}

/* ===================== INIT ===================== */
seedDemoData();