require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const connectDB = require('./config/db');

// ─── Environment Validation ────────────────────────────────────────────────
const REQUIRED_ENV = ['MONGODB_URI', 'JWT_SECRET'];
const missingEnv = REQUIRED_ENV.filter(k => !process.env[k]);
if (missingEnv.length > 0) {
    console.error(`\n❌  Missing required environment variables: ${missingEnv.join(', ')}`);
    console.error('   Copy .env.example → .env and fill in the values.\n');
    process.exit(1);
}
if (process.env.JWT_SECRET === 'your_super_secret_jwt_key_change_this') {
    if (process.env.NODE_ENV === 'production') {
        console.error('\n❌  JWT_SECRET is still a placeholder. Refusing to start in production.\n');
        process.exit(1);
    } else {
        console.warn('\n⚠️   JWT_SECRET is a placeholder. Change it before deploying!\n');
    }
}
// ──────────────────────────────────────────────────────────────────────────

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// ── Security Headers (Helmet) ──────────────────────────────────────────────
app.use(helmet({
    contentSecurityPolicy: false,   // off — inline scripts used in HTML pages
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false  // allow Google Sign-In popups to return to main window
}));

// ── CORS — restrict to same origin in production ───────────────────────────
const allowedOrigins = process.env.NODE_ENV === 'production'
    ? [process.env.APP_URL || ''].filter(Boolean)
    : ['http://localhost:3000', 'http://127.0.0.1:3000'];

app.use(cors({
    origin: (origin, cb) => {
        // allow same-origin requests (no origin header), allowed list, and Vercel preview URLs
        if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
            return cb(null, true);
        }
        cb(new Error('Not allowed by CORS'));
    },
    credentials: true
}));

// ── Body Parsers — limit payload size to prevent large-body attacks ────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ── NoSQL Injection Prevention ─────────────────────────────────────────────
// Strips $ and . from req.body, req.query, req.params
app.use(mongoSanitize({ replaceWith: '_' }));

// ── HTTP Parameter Pollution Prevention ───────────────────────────────────
app.use(hpp());

// ── Global API Rate Limiter — 100 req / 15 min per IP ─────────────────────
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests. Please try again later.' }
});
app.use('/api/', apiLimiter);

// ── Static Files ──────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public/pages')));

// ── API Routes ────────────────────────────────────────────────────────────
app.use('/api/auth',     require('./routes/auth.routes'));
app.use('/api/products', require('./routes/product.routes'));
app.use('/api/bookings', require('./routes/booking.routes'));
app.use('/api/mechanics',require('./routes/mechanic.routes'));
app.use('/api/payments', require('./routes/payment.routes'));

// ── Health Check ──────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'SamMoto backend is running.' });
});

// ── Global Error Handler — never leak stack traces ─────────────────────────
app.use((err, req, res, next) => {
    // CORS error
    if (err.message === 'Not allowed by CORS') {
        return res.status(403).json({ success: false, message: 'CORS: Origin not allowed.' });
    }
    console.error('[ERROR]', err.message);
    const status = err.status || err.statusCode || 500;
    res.status(status).json({
        success: false,
        // In production, never send the real error message for 500s
        message: status === 500 && process.env.NODE_ENV === 'production'
            ? 'Internal server error.'
            : err.message
    });
});

// ── Catch-all: serve index.html ───────────────────────────────────────────
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/pages/index.html'));
});

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`\n🏍️  SamMoto server running at http://localhost:${PORT}`);
        console.log(`📁  Visit http://localhost:${PORT} to view the app.\n`);
    });
}

module.exports = app;
