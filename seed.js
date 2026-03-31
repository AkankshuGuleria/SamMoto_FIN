require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Product = require('./models/Product');
const Mechanic = require('./models/Mechanic');

const seed = async () => {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing
    await Promise.all([User.deleteMany(), Product.deleteMany(), Mechanic.deleteMany()]);
    console.log('🗑️  Cleared existing data');

    // Users
    await User.create([
        { name: 'Admin User', email: 'admin@sammoto.in', password: 'sammoto123', role: 'admin', phone: '+919876543210' },
        { name: 'Rahul Sharma', email: 'customer@sammoto.in', password: 'sammoto123', role: 'customer', phone: '+919876500001' }
    ]);
    console.log('👤 Created users: admin@sammoto.in / customer@sammoto.in (password: sammoto123)');

    // Products
    await Product.create([
        { title: 'Engine Oil 10W-40 (1L)', description: 'Premium semi-synthetic engine oil for 4-stroke bikes', category: 'oil', price: 349, stock: 50, icon: 'fa-oil-can' },
        { title: 'KTM Duke Air Filter', description: 'OEM air filter for KTM Duke 125/200/390', category: 'part', price: 599, stock: 30, icon: 'fa-filter' },
        { title: 'Royal Enfield Brake Pads (Set)', description: 'Front and rear disc brake pads for Classic/Bullet 350', category: 'part', price: 799, stock: 25, icon: 'fa-circle-dot' },
        { title: 'Motorcycle Phone Mount', description: 'Universal aluminium handlebar mount, fits all bikes', category: 'accessory', price: 449, stock: 40, icon: 'fa-mobile-screen' },
        { title: 'Helmet (Full Face ISI)', description: 'ISI certified full-face helmet with visor', category: 'accessory', price: 2499, stock: 15, icon: 'fa-hard-hat' },
        { title: 'Chain Lubricant Spray', description: 'Advanced chain lube, 500ml, suitable for all bikes', category: 'oil', price: 249, stock: 60, icon: 'fa-spray-can' },
        { title: 'Spark Plug (NGK)', description: 'NGK genuine spark plug, universal fitment for 150-400cc', category: 'part', price: 199, stock: 80, icon: 'fa-bolt' },
        { title: 'Tyre Puncture Kit', description: 'Portable tubeless tyre repair kit with CO2 inflator', category: 'accessory', price: 349, stock: 35, icon: 'fa-circle-dot' },
        { title: 'General Service', description: 'Full bike service: oil, filter, chain, brake, wash', category: 'service', price: 799, stock: 99, icon: 'fa-wrench' },
        { title: 'Engine Repair & Overhaul', description: 'Full engine diagnosis and repair by expert mechanics', category: 'service', price: 4999, stock: 99, icon: 'fa-gear' },
        { title: 'Bike Wash & Polish', description: 'Full exterior wash, wax, and chrome polish', category: 'service', price: 299, stock: 99, icon: 'fa-soap' },
        { title: 'Carburetor Cleaning', description: 'Professional carb cleaning and calibration', category: 'service', price: 599, stock: 99, icon: 'fa-circle-nodes' },
    ]);
    console.log('📦 Created 12 products');

    // Mechanics
    await Mechanic.create([
        { name: 'Gurpreet Singh', phone: '+919876511001', specialization: 'Engine', experience: 8, status: 'Available', rating: 4.9 },
        { name: 'Harjit Kaur', phone: '+919876511002', specialization: 'Electrical', experience: 5, status: 'Available', rating: 4.7 },
        { name: 'Mandeep Kumar', phone: '+919876511003', specialization: 'Tyres & Brakes', experience: 4, status: 'Busy', rating: 4.6 },
        { name: 'Sukhveer Dhillon', phone: '+919876511004', specialization: 'General', experience: 6, status: 'Available', rating: 4.8 },
        { name: 'Parminder Brar', phone: '+919876511005', specialization: 'Suspension', experience: 3, status: 'Off Duty', rating: 4.5 },
    ]);
    console.log('🔧 Created 5 mechanics');

    console.log('\n✅ Seed complete! You can now run: npm run dev\n');
    process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });
