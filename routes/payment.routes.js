const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { verifyToken } = require('../middleware/auth');

let Razorpay;
try { Razorpay = require('razorpay'); } catch (e) { Razorpay = null; }

// POST /api/payments/create-order
router.post('/create-order', verifyToken, async (req, res) => {
    try {
        if (!Razorpay || !process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            return res.status(503).json({ success: false, message: 'Payment gateway not configured.' });
        }

        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET
        });

        const { amount, currency = 'INR', bookingId } = req.body;
        if (!amount) return res.status(400).json({ success: false, message: 'Amount is required.' });

        const order = await razorpay.orders.create({
            amount: Math.round(amount * 100), // Razorpay uses paise
            currency,
            receipt: bookingId || `rcpt_${Date.now()}`,
            notes: { bookingId }
        });

        res.json({
            success: true,
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId: process.env.RAZORPAY_KEY_ID
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST /api/payments/verify
router.post('/verify', verifyToken, async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ success: false, message: 'Payment verification failed.' });
        }

        res.json({ success: true, message: 'Payment verified.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
