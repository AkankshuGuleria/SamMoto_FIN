const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const { verifyToken } = require('../middleware/auth');
const { OAuth2Client } = require('google-auth-library');
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);


// ── Strict rate limit for auth endpoints — 10 per 15 min per IP ──────────
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { success: false, message: 'Too many attempts. Please try again in 15 minutes.' }
});

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
});

// ── Input validators ──────────────────────────────────────────────────────
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function sanitizeString(str) {
    if (typeof str !== 'string') return '';
    return str.trim().substring(0, 200); // max length guard
}

// POST /api/auth/register
router.post('/register', authLimiter, async (req, res) => {
    try {
        const name     = sanitizeString(req.body.name);
        const email    = sanitizeString(req.body.email).toLowerCase();
        const password = typeof req.body.password === 'string' ? req.body.password : '';
        const phone    = sanitizeString(req.body.phone || '');

        if (!name || !email || !password)
            return res.status(400).json({ success: false, message: 'Name, email and password are required.' });
        if (!EMAIL_REGEX.test(email))
            return res.status(400).json({ success: false, message: 'Invalid email address.' });
        if (password.length < 6)
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
        if (password.length > 72)
            return res.status(400).json({ success: false, message: 'Password too long.' });

        const existing = await User.findOne({ email });
        if (existing)
            return res.status(409).json({ success: false, message: 'Email already registered.' });

        const user = await User.create({ name, email, password, phone });
        const token = signToken(user._id);

        res.status(201).json({ success: true, token, role: user.role, name: user.name, email: user.email });
    } catch (err) {
        console.error('[register]', err.message);
        res.status(500).json({ success: false, message: 'Registration failed. Please try again.' });
    }
});

// POST /api/auth/login
router.post('/login', authLimiter, async (req, res) => {
    try {
        const email    = sanitizeString(req.body.email || '').toLowerCase();
        const password = typeof req.body.password === 'string' ? req.body.password : '';

        if (!email || !password)
            return res.status(400).json({ success: false, message: 'Email and password are required.' });
        if (!EMAIL_REGEX.test(email))
            return res.status(400).json({ success: false, message: 'Invalid email address.' });

        const user = await User.findOne({ email }).select('+password');
        // Use same message for wrong email OR wrong password — prevents user enumeration
        if (!user) {
            await new Promise(r => setTimeout(r, 300)); // timing-safe delay
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch)
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });

        const token = signToken(user._id);
        res.json({ success: true, token, role: user.role, name: user.name, email: user.email });
    } catch (err) {
        console.error('[login]', err.message);
        res.status(500).json({ success: false, message: 'Login failed. Please try again.' });
    }
});

// POST /api/auth/logout — stateless; client discards token
router.post('/logout', (req, res) => {
    res.json({ success: true, message: 'Logged out.' });
});

// POST /api/auth/google — authenticate via Google JWT
router.post('/google', authLimiter, async (req, res) => {
    try {
        const { credential } = req.body;
        if (!credential) return res.status(400).json({ success: false, message: 'Missing Google credential.' });

        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const { sub, email, name } = payload;

        let user = await User.findOne({ email });
        if (user) {
            if (!user.googleId) {
                user.googleId = sub;
                await user.save();
            }
        } else {
            user = await User.create({ name: name || 'Google User', email: email.toLowerCase(), googleId: sub, role: 'customer' });
        }

        const token = signToken(user._id);
        res.json({ success: true, token, role: user.role, name: user.name, email: user.email });
    } catch (err) {
        console.error('[google login]', err.message);
        res.status(401).json({ success: false, message: 'Google authentication failed.' });
    }
});

// GET /api/auth/me — return only safe fields
router.get('/me', verifyToken, (req, res) => {
    const { _id, name, email, phone, role, createdAt } = req.user;
    res.json({ success: true, user: { _id, name, email, phone, role, createdAt } });
});

module.exports = router;
