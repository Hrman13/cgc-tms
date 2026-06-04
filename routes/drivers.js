/**
 * CGC University TMS – Driver Routes
 * =====================================
 * GET  /driver-register   → Driver registration form
 * POST /driver-register   → Save new driver to DB
 * GET  /drivers           → List all drivers
 */

const express = require('express');
const router  = express.Router();
const db      = require('../db');

// GET /driver-register
router.get('/driver-register', (req, res) => {
  res.render('drivers/register', {
    title: 'Register Driver',
    user: req.session.user,
    success: null,
    error: null,
    formData: {}
  });
});

// POST /driver-register
router.post('/driver-register', async (req, res) => {
  const { name, phone, license_no } = req.body;

  if (!name || !phone || !license_no) {
    return res.render('drivers/register', {
      title: 'Register Driver',
      user: req.session.user,
      success: null,
      error: 'All fields are required.',
      formData: req.body
    });
  }

  try {
    // Check duplicate license
    const [existing] = await db.execute(
      'SELECT id FROM drivers WHERE license_no = ? LIMIT 1', [license_no]
    );
    if (existing.length) {
      return res.render('drivers/register', {
        title: 'Register Driver',
        user: req.session.user,
        success: null,
        error: 'A driver with this license number already exists.',
        formData: req.body
      });
    }

    await db.execute(
      'INSERT INTO drivers (name, phone, license_no) VALUES (?, ?, ?)',
      [name, phone, license_no]
    );

    res.render('drivers/register', {
      title: 'Register Driver',
      user: req.session.user,
      success: `Driver "${name}" registered successfully.`,
      error: null,
      formData: {}
    });
  } catch (err) {
    console.error('Driver register error:', err);
    res.render('drivers/register', {
      title: 'Register Driver',
      user: req.session.user,
      success: null,
      error: 'Server error. Please try again.',
      formData: req.body
    });
  }
});

// GET /drivers
router.get('/', async (req, res) => {
  try {
    const [drivers] = await db.execute('SELECT * FROM drivers ORDER BY id DESC');
    res.render('drivers/list', {
      title: 'Driver List',
      user: req.session.user,
      drivers
    });
  } catch (err) {
    console.error('Driver list error:', err);
    res.render('drivers/list', {
      title: 'Driver List',
      user: req.session.user,
      drivers: []
    });
  }
});

module.exports = router;