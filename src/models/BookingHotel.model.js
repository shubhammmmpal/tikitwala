// bookingHotel.model.js
import mongoose from 'mongoose';

const bookingHotelSchema = new mongoose.Schema({
  bookedById: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  source: {
    type: String,
    enum: ['USER', 'AGENT'],
    required: true
  },
  
  // If agent books for a registered customer
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  hotel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel',
    required: true
  },
  
  // Multi-room support (one booking = multiple room types/quantities)
  rooms: [{
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: true
    },
    quantity: { type: Number, required: true, min: 1 },
    pricePerNight: { type: Number, required: true }
  }],
  
  checkInDate: { type: Date, required: true },
  checkOutDate: { type: Date, required: true },
  
  guestDetails: [{
    name: { type: String, required: true },
    phone: Number,
    email: String,
    idProofType: String,
    idProofNumber: String
  }],
  otherCharges: { 
    tax: { type: Number, default: 0 },
    serviceFee: { type: Number, default: 0 },
    convinenceFee: { type: Number, default: 0 },
  },

  
  totalPrice: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  
  status: {
    type: String,
    enum: ['PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED', 'NO_SHOW'],
    default: 'PENDING'
  },
  
  paymentStatus: {
    type: String,
    enum: ['PENDING', 'PAID', 'PARTIALLY_REFUNDED', 'REFUNDED', 'FAILED'],
    default: 'PENDING'
  },
  
  appliedCoupon: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coupon'
  },
  discountAmount: { type: Number, default: 0 },
  
  // Snapshot of policy at booking time
  appliedCancellationPolicy: String,
  
  cancellationReason: String,
  refundAmount: { type: Number, default: 0 },
  
  notes: String
}, { timestamps: true });

// Indexes for common queries
bookingHotelSchema.index({ bookedById: 1, status: 1 });
bookingHotelSchema.index({ hotel: 1, checkInDate: 1 });
bookingHotelSchema.index({ checkInDate: 1, checkOutDate: 1 });
bookingHotelSchema.index({ status: 1, paymentStatus: 1 });

// Virtuals
bookingHotelSchema.virtual('numberOfNights').get(function() {
  const diff = Math.abs(this.checkOutDate - this.checkInDate);
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

bookingHotelSchema.virtual('totalGuests').get(function() {
  return this.guestDetails.length;
});

const BookingHotel = mongoose.model('BookingHotel', bookingHotelSchema);
export default BookingHotel;