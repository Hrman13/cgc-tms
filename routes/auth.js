/**
 * CGC University TMS – Auth Routes
 * ==================================
 * GET  /login   → Login page (unified for all roles)
 * POST /login   → Authenticate and redirect by role
 * GET  /logout  → Destroy session and redirect to login
 */

const express = require('express');
const router  = express.Router();
const db      = require('../db');
const bcrypt  = require('bcrypt');

// GET /login
router.get('/login', (req, res) => {
  if (req.session.user) {
    return res.redirect('/');
  }
  res.render('login', {
    title: 'Login - CGC University TMS',
    error: null
  });
});

// POST /login
router.post('/login', async (req, res) => {
  const { role, login_id, password } = req.body;

  if (!role || !login_id || !password) {
    return res.render('login', {
      title: 'Login - CGC University TMS',
      error: 'All fields are required.'
    });
  }

  try {
    let user = null;

    if (role === 'student') {
      // Students table uses id as login
      const [rows] = await db.execute(
        'SELECT * FROM students WHERE id = ? LIMIT 1',
        [login_id]
      );
      if (rows.length && await bcrypt.compare(password, rows[0].password)) {
        user = { id: rows[0].id, name: rows[0].name, role: 'student' };
      }

    } else if (role === 'driver') {
      // Drivers use id as login, no password stored — use fixed password or extend table
      const [rows] = await db.execute(
        'SELECT * FROM drivers WHERE id = ? LIMIT 1',
        [login_id]
      );
      // For demo: drivers use license_no as password
      if (rows.length && rows[0].license_no === password) {
        user = { id: rows[0].id, name: rows[0].name, role: 'driver' };
      }

    } else if (role === 'admin') {
      // Admins table (extend schema if needed)
      // Demo: hardcoded admin for simplicity
      if (login_id === 'ADMIN01' && password === 'admin123') {
        user = { id: 'ADMIN01', name: 'Administrator', role: 'admin' };
      }
    }

    if (!user) {
      return res.render('login', {
        title: 'Login - CGC University TMS',
        error: 'Invalid credentials. Please check your ID and password.'
      });
    }

    req.session.user = user;

    // Redirect based on role
    if (user.role === 'admin')   return res.redirect('/admin/dashboard');
    if (user.role === 'driver')  return res.redirect('/drivers');
    return res.redirect('/students');

  } catch (err) {
    console.error('Login error:', err);
    return res.render('login', {
      title: 'Login - CGC University TMS',
      error: 'Server error. Please try again.'
    });
  }
});

// GET /logout
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

module.exports = router;