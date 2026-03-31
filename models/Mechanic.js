const mongoose = require('mongoose');

const mechanicSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true },
    email: { type: String, default: '' },
    specialization: {
        type: String,
        enum: ['Engine', 'Electrical', 'Tyres & Brakes', 'Suspension', 'General', 'Bodywork'],
        default: 'General'
    },
    experience: { type: Number, default: 1 },
    status: { type: String, enum: ['Available', 'Busy', 'Off Duty'], default: 'Available' },
    rating: { type: Number, default: 4.5, min: 1, max: 5 }
}, { timestamps: true });

module.exports = mongoose.model('Mechanic', mechanicSchema);
