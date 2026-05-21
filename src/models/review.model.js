// review.model.js
import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    // =========================================
    // USER
    // =========================================

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // =========================================
    // DYNAMIC ENTITY
    // =========================================

    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "entityType",
    },

    // =========================================
    // ENTITY TYPE
    // =========================================

    entityType: {
      type: String,
      required: true,
      enum: ["Hotel", "Bus", "BusTrip", "Train", "Flight", "Trip","BusTrip"],
    },

    // =========================================
    // BOOKING REFERENCE
    // =========================================

    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "bookingModel",
    },

    // =========================================
    // BOOKING MODEL
    // =========================================

    bookingModel: {
      type: String,
      required: true,
      enum: [
        "BookingHotel",
        "Booking",
        "TrainBooking",
        "FlightBooking",
        "TripBooking",
      ],
    },

    // =========================================
    // RATING
    // =========================================

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    // =========================================
    // COMMENT
    // =========================================

    comment: {
      type: String,
      maxlength: 1000,
      trim: true,
    },

    // =========================================
    // REVIEW IMAGES
    // =========================================

    images: [String],

    // =========================================
    // OPTIONAL REVIEW TITLES
    // =========================================

    title: {
      type: String,
      trim: true,
      maxlength: 100,
    },

    // =========================================
    // VERIFIED REVIEW
    // =========================================

    isVerified: {
      type: Boolean,
      default: false,
    },

    // =========================================
    // ADMIN MODERATION
    // =========================================

    isApproved: {
      type: Boolean,
      default: true,
    },

    // =========================================
    // ADMIN REPLY
    // =========================================

    adminReply: {
      message: String,
      repliedAt: Date,
    },
  },
  {
    timestamps: true,
  },
);

// =========================================
// UNIQUE REVIEW
// ONE USER CAN REVIEW ENTITY ONLY ONCE
// =========================================

reviewSchema.index(
  {
    user: 1,
    entityId: 1,
  },
  {
    unique: true,
  },
);

// =========================================
// FAST SEARCHING
// =========================================

reviewSchema.index({
  entityId: 1,
  rating: -1,
});

reviewSchema.index({
  entityType: 1,
});

const Review = mongoose.model("Review", reviewSchema);

export default Review;
