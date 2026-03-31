const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    category: {
        type: String,
        enum: ['part', 'accessory', 'service', 'oil'],
        required: true
    },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, default: 99 },
    icon: { type: String, default: 'fa-box' },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
