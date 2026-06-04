/**
 * CGC University TMS – Student Routes
 * =====================================
 * GET  /register        → Register student form
 * POST /register        → Save new student to DB
 * GET  /students        → List all students
 * GET  /search?q=       → Search students by name or bus_no
 */

const express = require('express');
const router  = express.Router();
const db      = require('../db');
const bcrypt  = require('bcrypt');

// GET /register
router.get('/register', (req, res) => {
  res.render('students/register', {
    title: 'Register Student',
    user: req.session.user,
    success: null,
    error: null,
    formData: {}
  });
});

// POST /register
router.post('/register', async (req, res) => {
  const { name, email, password, course, bus_no } = req.body;

  if (!name || !email || !password || !course || !bus_no) {
    return res.render('students/register', {
      title: 'Register Student',
      user: req.session.user,
      success: null,
      error: 'All fields are required.',
      formData: req.body
    });
  }

  try {
    // Check if email exists
    const [existing] = await db.execute(
      'SELECT id FROM students WHERE email = ? LIMIT 1', [email]
    );
    if (existing.length) {
      return res.render('students/register', {
        title: 'Register Student',
        user: req.session.user,
        success: null,
        error: 'A student with this email already exists.',
        formData: req.body
      });
    }

    const hashed = await bcrypt.hash(password, 10);
    await db.execute(
      'INSERT INTO students (name, email, password, course, bus_no) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashed, course, bus_no]
    );

    res.render('students/register', {
      title: 'Register Student',
      user: req.session.user,
      success: `Student "${name}" registered successfully.`,
      error: null,
      formData: {}
    });
  } catch (err) {
    console.error('Student register error:', err);
    res.render('students/register', {
      title: 'Register Student',
      user: req.session.user,
      success: null,
      error: 'Server error. Please try again.',
      formData: req.body
    });
  }
});

// GET /students
router.get('/', async (req, res) => {
  try {
    const [students] = await db.execute('SELECT * FROM students ORDER BY id DESC');
    res.render('students/list', {
      title: 'Student List',
      user: req.session.user,
      students
    });
  } catch (err) {
    console.error('Student list error:', err);
    res.render('students/list', {
      title: 'Student List',
      user: req.session.user,
      students: []
    });
  }
});

// GET /search?q=
router.get('/search', async (req, res) => {
  const q = (req.query.q || '').trim();
  let results = [];

  if (q) {
    try {
      const [rows] = await db.execute(
        'SELECT * FROM students WHERE name LIKE ? OR bus_no LIKE ? ORDER BY name',
        [`%${q}%`, `%${q}%`]
      );
      results = rows;
    } catch (err) {
      console.error('Search error:', err);
    }
  }

  res.render('students/search', {
    title: 'Search Students',
    user: req.session.user,
    results,
    query: q
  });
});

module.exports = router;