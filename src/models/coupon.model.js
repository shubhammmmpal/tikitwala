// coupon.model.js
import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema(
  {
    // Coupon Code
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },

    // Service Type
    serviceType: {
      type: String,
      enum: ['ALL', 'TRAIN', 'BUS', 'FLIGHT', 'HOTEL', 'TRIP'],
      default: 'ALL'
    },

    // Specific Entities
    applicableEntityIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'entityModel'
      }
    ],

    // Dynamic Model Reference
    entityModel: {
      type: String,
      enum: ['Train', 'Bus', 'Flight', 'Hotel', 'Trip'],
      required: function () {
        return (
          this.applicableEntityIds &&
          this.applicableEntityIds.length > 0
        );
      }
    },

    // Discount Type
    discountType: {
      type: String,
      enum: ['PERCENTAGE', 'FIXED_AMOUNT'],
      required: true
    },

    // Discount Value
    discountValue: {
      type: Number,
      required: true,
      min: 0
    },

    // Minimum Booking Amount
    minBookingAmount: {
      type: Number,
      default: 0
    },

    // Max Discount Cap
    maxDiscountAmount: {
      type: Number,
      default: null
    },

    // Expiry
    expiryDate: {
      type: Date,
      required: true
    },

    // Active / Inactive
    isActive: {
      type: Boolean,
      default: true
    },

    // Applicable User Type
    applicableTo: {
      type: String,
      enum: ['ALL', 'USER', 'AGENT'],
      default: 'ALL'
    },

    // ✅ First Time User Coupon
    firstTimeUserOnly: {
      type: Boolean,
      default: false
    },

    // ✅ First Booking For Specific Service
    firstTimeForService: {
      type: Boolean,
      default: false
    },

    // Total Usage Limit
    totalUsageLimit: {
      type: Number,
      default: null // null = unlimited
    },

    // Total Used Count
    usedCount: {
      type: Number,
      default: 0
    },

    // Per User Usage Limit
    perUserLimit: {
      type: Number,
      default: 1
    },

    // Optional Start Date
    startDate: {
      type: Date,
      default: Date.now
    },

    // Optional Description
    description: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

// ================= INDEXES =================

// Unique Coupon Code
couponSchema.index({ code: 1 }, { unique: true });

// Fast Expiry + Active Search
couponSchema.index({ expiryDate: 1, isActive: 1 });

// Service Type Search
couponSchema.index({ serviceType: 1 });

// ================= EXPORT =================

const Coupon = mongoose.model('Coupon', couponSchema);

export default Coupon;