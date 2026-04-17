const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// ── Helpers ───────────────────────────────────────────────────────────────
const sanitize = (str, max = 200) => (typeof str === 'string' ? str.trim().substring(0, max) : '');
const safeErr  = (res, code, msg) => res.status(code).json({ success: false, message: msg });

// POST /api/bookings — create booking (auth required)
router.post('/', verifyToken, async (req, res) => {
    try {
        const bikeModel          = sanitize(req.body.bikeModel, 100);
        const registrationNumber = sanitize(req.body.registrationNumber, 20).toUpperCase();
        const serviceType        = sanitize(req.body.serviceType, 100);
        const serviceDate        = req.body.serviceDate;
        const serviceTime        = sanitize(req.body.serviceTime, 10) || '10:00';
        const notes              = sanitize(req.body.notes, 500);
        const items              = Array.isArray(req.body.items) ? req.body.items.slice(0, 50) : [];
        const subtotal           = Math.max(0, parseFloat(req.body.subtotal) || 0);
        const laborCost          = Math.max(0, parseFloat(req.body.laborCost) || 0);
        const totalAmount        = Math.max(0, parseFloat(req.body.totalAmount) || 0);

        if (!bikeModel || !registrationNumber || !serviceType || !serviceDate)
            return safeErr(res, 400, 'Bike model, registration number, service type and date are required.');

        // Validate date is in the future
        const sDate = new Date(serviceDate);
        if (isNaN(sDate.getTime()) || sDate <= new Date())
            return safeErr(res, 400, 'Service date must be a future date.');

        const booking = await Booking.create({
            user: req.user._id,
            customerName: req.user.name,
            customerEmail: req.user.email,
            customerPhone: req.user.phone || '',
            bikeModel, registrationNumber, serviceType, serviceDate: sDate,
            serviceTime, notes, items, subtotal, laborCost, totalAmount
        });

        res.status(201).json({ success: true, booking });
    } catch (err) {
        console.error('[booking create]', err.message);
        safeErr(res, 400, 'Failed to create booking. Please check your input.');
    }
});

// GET /api/bookings/history — customer sees their own bookings
router.get('/history', verifyToken, async (req, res) => {
    try {
        const bookings = await Booking.find({ user: req.user._id })
            .select('-__v').sort({ createdAt: -1 }).limit(100);
        res.json(bookings);
    } catch (err) {
        console.error('[booking history]', err.message);
        safeErr(res, 500, 'Failed to load bookings.');
    }
});

// GET /api/bookings/stats — admin dashboard stats
router.get('/stats', verifyToken, requireAdmin, async (req, res) => {
    try {
        const [total, completed, pending, inProgress, revenueResult, customers] = await Promise.all([
            Booking.countDocuments(),
            Booking.countDocuments({ status: 'Completed' }),
            Booking.countDocuments({ status: 'Pending' }),
            Booking.countDocuments({ status: 'In Progress' }),
            Booking.aggregate([{ $match: { paymentStatus: 'Paid' } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
            Booking.distinct('user')
        ]);
        res.json({ total, completed, pending, inProgress, revenue: revenueResult[0]?.total || 0, customers: customers.length });
    } catch (err) {
        console.error('[booking stats]', err.message);
        safeErr(res, 500, 'Failed to load stats.');
    }
});

// GET /api/bookings/all — admin sees all bookings
router.get('/all', verifyToken, requireAdmin, async (req, res) => {
    try {
        const bookings = await Booking.find()
            .select('-__v')
            .populate('user', 'name email')
            .populate('mechanic', 'name')
            .sort({ createdAt: -1 })
            .limit(500);
        res.json(bookings);
    } catch (err) {
        console.error('[booking all]', err.message);
        safeErr(res, 500, 'Failed to load bookings.');
    }
});

// GET /api/bookings/:id — get single booking (owner or admin)
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id).select('-__v');
        if (!booking) return safeErr(res, 404, 'Booking not found.');
        if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin')
            return safeErr(res, 403, 'Not authorised.');
        res.json(booking);
    } catch (err) {
        console.error('[booking get]', err.message);
        safeErr(res, 500, 'Failed to load booking.');
    }
});

// PATCH /api/bookings/:id/status — admin updates status
router.patch('/:id/status', verifyToken, requireAdmin, async (req, res) => {
    try {
        const ALLOWED_STATUSES = ['Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'];
        const status = sanitize(req.body.status, 20);
        if (!ALLOWED_STATUSES.includes(status))
            return safeErr(res, 400, 'Invalid status value.');

        const update = { status };
        if (req.body.mechanic) update.mechanic = req.body.mechanic;

        const booking = await Booking.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
        if (!booking) return safeErr(res, 404, 'Booking not found.');

        // Send email if marked as Completed
        if (status === 'Completed' && booking.customerEmail && process.env.EMAIL_USER) {
            try {
                await transporter.sendMail({
                    from: `"SamMoto Bikes" <${process.env.EMAIL_USER}>`,
                    to: booking.customerEmail,
                    subject: 'Your Vehicle is Ready! - SamMoto',
                    html: `
                        <div style="font-family:Arial,sans-serif;color:#333;line-height:1.6;">
                            <h2>Hi ${booking.customerName},</h2>
                            <p>Great news! The service for your <strong>${booking.bikeModel}</strong> (${booking.registrationNumber}) is now complete.</p>
                            <p>Your vehicle is ready for pickup.</p>
                            <br/>
                            <p>Thank you for choosing SamMoto!<br/>The SamMoto Team</p>
                        </div>
                    `
                });
            } catch (mailErr) {
                console.error('[booking status] Email failed:', mailErr.message);
                // Don't fail the request if email fails
            }
        }

        res.json({ success: true, booking });
    } catch (err) {
        console.error('[booking status]', err.message);
        safeErr(res, 400, 'Failed to update booking status.');
    }
});

// PATCH /api/bookings/:id/payment — update payment after Razorpay verification (owner or admin)
router.patch('/:id/payment', verifyToken, async (req, res) => {
    try {
        const existing = await Booking.findById(req.params.id);
        if (!existing) return safeErr(res, 404, 'Booking not found.');
        if (existing.user.toString() !== req.user._id.toString() && req.user.role !== 'admin')
            return safeErr(res, 403, 'Not authorised.');

        const razorpayPaymentId = sanitize(req.body.razorpayPaymentId, 100);
        const razorpayOrderId   = sanitize(req.body.razorpayOrderId, 100);

        const booking = await Booking.findByIdAndUpdate(
            req.params.id,
            { razorpayPaymentId, razorpayOrderId, paymentStatus: 'Paid', status: 'Confirmed' },
            { new: true }
        );
        res.json({ success: true, booking });
    } catch (err) {
        console.error('[booking payment]', err.message);
        safeErr(res, 500, 'Failed to update payment.');
    }
});

module.exports = router;
