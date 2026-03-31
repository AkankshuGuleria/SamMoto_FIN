const mongoose = require('mongoose');

const bookingItemSchema = new mongoose.Schema({
    productId: String,
    name: String,
    price: Number,
    qty: Number,
    type: String
}, { _id: false });

const bookingSchema = new mongoose.Schema({
    bookingCode: {
        type: String,
        unique: true,
        default: () => 'SM-' + Math.random().toString(36).substring(2, 8).toUpperCase()
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    customerName: String,
    customerEmail: String,
    customerPhone: String,

    bikeModel: { type: String, required: true },
    registrationNumber: { type: String, required: true },
    serviceType: { type: String, required: true },
    serviceDate: { type: Date, required: true },
    serviceTime: { type: String, default: '10:00' },
    notes: { type: String, default: '' },

    items: [bookingItemSchema],
    subtotal: { type: Number, default: 0 },
    laborCost: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },

    status: {
        type: String,
        enum: ['Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'],
        default: 'Pending'
    },
    paymentStatus: { type: String, enum: ['Unpaid', 'Paid', 'Refunded'], default: 'Unpaid' },
    razorpayOrderId: String,
    razorpayPaymentId: String,

    mechanic: { type: mongoose.Schema.Types.ObjectId, ref: 'Mechanic', default: null }
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
