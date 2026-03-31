const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { verifyToken, requireAdmin } = require('../middleware/auth');

const sanitize = (str, max = 200) => (typeof str === 'string' ? str.trim().substring(0, max) : '');
const safeErr  = (res, code, msg) => res.status(code).json({ success: false, message: msg });

const ALLOWED_CATEGORIES = ['part', 'accessory', 'service', 'oil'];

// GET /api/products — public
router.get('/', async (req, res) => {
    try {
        const filter = { isActive: true };
        const cat = sanitize(req.query.category, 20);
        if (cat && cat !== 'all' && ALLOWED_CATEGORIES.includes(cat)) filter.category = cat;
        const products = await Product.find(filter).select('-__v').sort({ createdAt: -1 }).limit(200);
        res.json(products);
    } catch (err) {
        console.error('[products get]', err.message);
        safeErr(res, 500, 'Failed to load products.');
    }
});

// POST /api/products — admin only
router.post('/', verifyToken, requireAdmin, async (req, res) => {
    try {
        const title       = sanitize(req.body.title, 150);
        const description = sanitize(req.body.description, 500);
        const category    = sanitize(req.body.category, 20);
        const price       = parseFloat(req.body.price);
        const stock       = parseInt(req.body.stock) ?? 99;
        const icon        = sanitize(req.body.icon, 50) || 'fa-box';

        if (!title) return safeErr(res, 400, 'Product title is required.');
        if (!ALLOWED_CATEGORIES.includes(category)) return safeErr(res, 400, 'Invalid category.');
        if (isNaN(price) || price < 0) return safeErr(res, 400, 'Valid price is required.');

        const product = await Product.create({ title, description, category, price, stock, icon });
        res.status(201).json({ success: true, product });
    } catch (err) {
        console.error('[product create]', err.message);
        safeErr(res, 400, 'Failed to create product.');
    }
});

// PUT /api/products/:id — admin only
router.put('/:id', verifyToken, requireAdmin, async (req, res) => {
    try {
        const title       = sanitize(req.body.title, 150);
        const description = sanitize(req.body.description, 500);
        const category    = sanitize(req.body.category, 20);
        const price       = parseFloat(req.body.price);
        const stock       = parseInt(req.body.stock) ?? 99;
        const icon        = sanitize(req.body.icon, 50) || 'fa-box';

        if (!title) return safeErr(res, 400, 'Product title is required.');
        if (!ALLOWED_CATEGORIES.includes(category)) return safeErr(res, 400, 'Invalid category.');
        if (isNaN(price) || price < 0) return safeErr(res, 400, 'Valid price is required.');

        const product = await Product.findByIdAndUpdate(
            req.params.id,
            { title, description, category, price, stock, icon },
            { new: true, runValidators: true }
        );
        if (!product) return safeErr(res, 404, 'Product not found.');
        res.json({ success: true, product });
    } catch (err) {
        console.error('[product update]', err.message);
        safeErr(res, 400, 'Failed to update product.');
    }
});

// DELETE /api/products/:id — soft delete, admin only
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
        if (!product) return safeErr(res, 404, 'Product not found.');
        res.json({ success: true, message: 'Product removed.' });
    } catch (err) {
        console.error('[product delete]', err.message);
        safeErr(res, 500, 'Failed to delete product.');
    }
});

module.exports = router;
