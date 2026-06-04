/**
 * CGC University TMS – Admin Routes
 * =====================================
 * GET  /admin/dashboard  → Admin dashboard with stats
 */

const express = require('express');
const router  = express.Router();
const db      = require('../db');

// GET /admin/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const [[{ total_students }]] = await db.execute('SELECT COUNT(*) AS total_students FROM students');
    const [[{ total_drivers  }]] = await db.execute('SELECT COUNT(*) AS total_drivers  FROM drivers');
    const [[{ total_routes   }]] = await db.execute('SELECT COUNT(DISTINCT bus_no) AS total_routes FROM students');

    const [recent_students] = await db.execute('SELECT id, name, course, bus_no FROM students ORDER BY id DESC LIMIT 5');
    const [recent_drivers]  = await db.execute('SELECT id, name, phone, license_no FROM drivers ORDER BY id DESC LIMIT 5');

    res.render('admin/dashboard', {
      title: 'Admin Dashboard',
      user: req.session.user,
      stats: { total_students, total_drivers, total_routes },
      recent_students,
      recent_drivers
    });
  } catch (err) {
    console.error('Admin dashboard error:', err);
    res.render('admin/dashboard', {
      title: 'Admin Dashboard',
      user: req.session.user,
      stats: { total_students: 0, total_drivers: 0, total_routes: 0 },
      recent_students: [],
      recent_drivers: []
    });
  }
});

module.exports = router;