// coupon.model.js
import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  
  discountType: {
    type: String,
    enum: ['PERCENTAGE', 'FIXED_AMOUNT'],
    required: true
  },
  
  discountValue: { type: Number, required: true, min: 0 },
  
  minBookingAmount: { type: Number, default: 0 },
  maxDiscountAmount: Number, // cap for percentage discounts
  
  expiryDate: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  
  applicableTo: {
    type: String,
    enum: ['ALL', 'USER', 'AGENT'],
    default: 'ALL'
  },
  
  totalUsageLimit: { type: Number, default: null }, // null = unlimited
  usedCount: { type: Number, default: 0 },
  
  perUserLimit: { type: Number, default: 1 }
}, { timestamps: true });

couponSchema.index({ code: 1 }, { unique: true });
couponSchema.index({ expiryDate: 1, isActive: 1 });

const Coupon = mongoose.model('Coupon', couponSchema);
export default Coupon;