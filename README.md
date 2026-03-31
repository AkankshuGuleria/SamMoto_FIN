# 🏍️ SamMoto — Motorcycle Service & Shop Platform

A full-stack web application for a motorcycle workshop. Customers can book services, shop for spare parts, and track their service history. Admins manage bookings, inventory, and mechanics.

---

## 🚀 Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment variables
```bash
cp .env.example .env
```
Edit `.env` and fill in:
```
MONGODB_URI=mongodb://localhost:27017/sammoto
JWT_SECRET=your_super_secret_key_here
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

### 3. Seed the database with demo data
```bash
node seed.js
```
This creates:
- **Admin:** `admin@sammoto.in` / `sammoto123`
- **Customer:** `customer@sammoto.in` / `sammoto123`
- 12 products + 5 mechanics

### 4. Start the server
```bash
npm run dev       # development (nodemon)
npm start         # production
```

Visit: **http://localhost:3000**

---

## 📁 Project Structure

```
sammoto/
├── server.js              # Entry point
├── seed.js                # Demo data seeder
├── .env                   # Your secrets (never commit!)
├── config/
│   └── db.js              # MongoDB connection
├── models/
│   ├── User.js            # User schema (customer/admin)
│   ├── Product.js         # Spare parts & services
│   ├── Booking.js         # Service bookings
│   └── Mechanic.js        # Workshop mechanics
├── middleware/
│   └── auth.js            # JWT verify + admin role guard
├── routes/
│   ├── auth.routes.js     # /api/auth/*
│   ├── product.routes.js  # /api/products/*
│   ├── booking.routes.js  # /api/bookings/*
│   ├── mechanic.routes.js # /api/mechanics/*
│   └── payment.routes.js  # /api/payments/* (Razorpay)
└── public/
    ├── css/style.css       # Unified dark-theme stylesheet
    ├── js/
    │   ├── auth.js         # Auth module + toast notifications
    │   └── main.js         # Navbar renderer + cart badge
    └── pages/
        ├── index.html          # Homepage
        ├── login.html          # Login
        ├── signup.html         # Registration
        ├── shop.html           # Spare parts shop
        ├── cart.html           # Shopping cart
        ├── booking.html        # Service booking + Razorpay
        ├── cust_dashboard.html # Customer — my garage
        ├── admindashboard.html # Admin — overview stats
        ├── admin_bookings.html # Admin — manage bookings
        ├── admin_spares.html   # Admin — inventory CRUD
        └── admin_mechanics.html# Admin — team management
```

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| POST | `/api/auth/logout` | Public |
| GET  | `/api/auth/me` | Auth |

### Products
| Method | Endpoint | Access |
|--------|----------|--------|
| GET  | `/api/products` | Public |
| POST | `/api/products` | Admin |
| PUT  | `/api/products/:id` | Admin |
| DELETE | `/api/products/:id` | Admin |

### Bookings
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/bookings` | Auth |
| GET  | `/api/bookings/history` | Auth (own) |
| GET  | `/api/bookings/stats` | Admin |
| GET  | `/api/bookings/all` | Admin |
| PATCH | `/api/bookings/:id/status` | Admin |
| PATCH | `/api/bookings/:id/payment` | Auth |

### Payments (Razorpay)
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/payments/create-order` | Auth |
| POST | `/api/payments/verify` | Auth |

---

## ⚡ Features

- **Authentication** — JWT-based login/register, role-based access (customer/admin)
- **Shop** — Browse, filter, and search products by category
- **Cart** — Add items, adjust quantities, persisted in localStorage
- **Service Booking** — 3-step booking form with bike selector, service type, date/time
- **Razorpay Payment** — Online payment or pay-at-workshop option
- **Customer Dashboard** — View all bookings, stats, service history
- **Admin Dashboard** — Live stats (total bookings, revenue, pending, in-progress)
- **Admin Bookings** — Search, filter, update status, assign mechanics
- **Admin Inventory** — Full CRUD for spare parts and services
- **Admin Mechanics** — Add/edit/remove workshop team members

---

## 🔑 Razorpay Setup

1. Create account at [razorpay.com](https://razorpay.com)
2. Go to Settings → API Keys → Generate Test Key
3. Add `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` to `.env`
4. For testing, use Razorpay test card: `4111 1111 1111 1111`
