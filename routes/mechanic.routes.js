const express = require('express');
const router = express.Router();
const Mechanic = require('../models/Mechanic');
const { verifyToken, requireAdmin } = require('../middleware/auth');

const sanitize = (str, max = 200) => (typeof str === 'string' ? str.trim().substring(0, max) : '');
const safeErr  = (res, code, msg) => res.status(code).json({ success: false, message: msg });

const ALLOWED_SPECS   = ['Engine', 'Electrical', 'Tyres & Brakes', 'Suspension', 'General', 'Bodywork'];
const ALLOWED_STATUSES = ['Available', 'Busy', 'Off Duty'];

// GET /api/mechanics — admin only
router.get('/', verifyToken, requireAdmin, async (req, res) => {
    try {
        const mechanics = await Mechanic.find().select('-__v').sort({ name: 1 });
        res.json(mechanics);
    } catch (err) {
        console.error('[mechanics get]', err.message);
        safeErr(res, 500, 'Failed to load mechanics.');
    }
});

// POST /api/mechanics — admin only
router.post('/', verifyToken, requireAdmin, async (req, res) => {
    try {
        const name           = sanitize(req.body.name, 100);
        const phone          = sanitize(req.body.phone, 20);
        const email          = sanitize(req.body.email, 150);
        const specialization = sanitize(req.body.specialization, 50);
        const experience     = Math.max(0, Math.min(60, parseInt(req.body.experience) || 1));
        const status         = sanitize(req.body.status, 20);
        const rating         = Math.max(1, Math.min(5, parseFloat(req.body.rating) || 4.5));

        if (!name || !phone) return safeErr(res, 400, 'Name and phone are required.');
        if (!ALLOWED_SPECS.includes(specialization)) return safeErr(res, 400, 'Invalid specialization.');
        if (!ALLOWED_STATUSES.includes(status)) return safeErr(res, 400, 'Invalid status.');

        const mechanic = await Mechanic.create({ name, phone, email, specialization, experience, status, rating });
        res.status(201).json({ success: true, mechanic });
    } catch (err) {
        console.error('[mechanic create]', err.message);
        safeErr(res, 400, 'Failed to create mechanic.');
    }
});

// PUT /api/mechanics/:id — admin only
router.put('/:id', verifyToken, requireAdmin, async (req, res) => {
    try {
        const name           = sanitize(req.body.name, 100);
        const phone          = sanitize(req.body.phone, 20);
        const email          = sanitize(req.body.email, 150);
        const specialization = sanitize(req.body.specialization, 50);
        const experience     = Math.max(0, Math.min(60, parseInt(req.body.experience) || 1));
        const status         = sanitize(req.body.status, 20);
        const rating         = Math.max(1, Math.min(5, parseFloat(req.body.rating) || 4.5));

        if (!name || !phone) return safeErr(res, 400, 'Name and phone are required.');
        if (!ALLOWED_SPECS.includes(specialization)) return safeErr(res, 400, 'Invalid specialization.');
        if (!ALLOWED_STATUSES.includes(status)) return safeErr(res, 400, 'Invalid status.');

        const mechanic = await Mechanic.findByIdAndUpdate(
            req.params.id,
            { name, phone, email, specialization, experience, status, rating },
            { new: true, runValidators: true }
        );
        if (!mechanic) return safeErr(res, 404, 'Mechanic not found.');
        res.json({ success: true, mechanic });
    } catch (err) {
        console.error('[mechanic update]', err.message);
        safeErr(res, 400, 'Failed to update mechanic.');
    }
});

// DELETE /api/mechanics/:id — admin only
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
    try {
        const mechanic = await Mechanic.findByIdAndDelete(req.params.id);
        if (!mechanic) return safeErr(res, 404, 'Mechanic not found.');
        res.json({ success: true, message: 'Mechanic removed.' });
    } catch (err) {
        console.error('[mechanic delete]', err.message);
        safeErr(res, 500, 'Failed to delete mechanic.');
    }
});

module.exports = router;
