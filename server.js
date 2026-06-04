/**
 * CGC University Transport Management System
 * ============================================
 * Server Entry Point
 *
 * Tech Stack: Node.js + Express + MySQL + EJS
 *
 * NOTE: This file documents the intended backend architecture.
 * The live demo runs as a fully functional static frontend
 * (HTML + CSS + JS with localStorage) that mirrors all routes
 * and functionality described below.
 *
 * To run locally with a real backend:
 *   1. npm install express ejs mysql2 bcrypt express-session
 *   2. Configure db.js with your MySQL credentials
 *   3. Run the SQL schema in database/schema.sql
 *   4. node server.js
 */

const express = require('express');
const session = require('express-session');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// ── View Engine ──────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ── Middleware ───────────────────────────────────────────────
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: 'cgc-tms-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

// ── Auth Middleware ──────────────────────────────────────────
function requireAuth(role) {
  return (req, res, next) => {
    if (!req.session.user) return res.redirect('/login');
    if (role && req.session.user.role !== role && req.session.user.role !== 'admin') {
      return res.redirect('/login');
    }
    next();
  };
}

// ── Routes ───────────────────────────────────────────────────
const authRoutes    = require('./routes/auth');
const studentRoutes = require('./routes/students');
const driverRoutes  = require('./routes/drivers');
const adminRoutes   = require('./routes/admin');

app.use('/',         authRoutes);
app.use('/students', requireAuth(), studentRoutes);
app.use('/drivers',  requireAuth(), driverRoutes);
app.use('/admin',    requireAuth('admin'), adminRoutes);

// ── Root Redirect ────────────────────────────────────────────
app.get('/', (req, res) => {
  if (req.session.user) {
    const role = req.session.user.role;
    if (role === 'admin')   return res.redirect('/admin/dashboard');
    if (role === 'driver')  return res.redirect('/drivers');
    return res.redirect('/students');
  }
  res.redirect('/login');
});

// ── 404 Handler ──────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).render('404', { title: '404 Not Found' });
});

// ── Start ────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`CGC University TMS running on http://localhost:${PORT}`);
});

module.exports = app;