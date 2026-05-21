// hotel.model.js
import mongoose from "mongoose";

const hotelSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },

    address: {
      street: { type: String, required: true },
      city: { type: String, required: true, index: true },
      state: String,
      country: { type: String, required: true, default: "India" },
      pincode: String,
    },

    // GeoJSON for location-based search & radius queries
    geoLocation: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },

    amenities: [String], // e.g. ["WiFi", "Swimming Pool", "Restaurant", "Spa", "Parking", "Gym"]

    images: [
      {
        url: { type: String, required: true },
        caption: String,
        isCover: { type: Boolean, default: false },
      },
    ],

    // Denormalized for fast reads
    ratings: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },

      totalReviews: {
        type: Number,
        default: 0,
      },

      distribution: {
        1: {
          count: {
            type: Number,
            default: 0,
          },
          percentage: {
            type: Number,
            default: 0,
          },
        },

        2: {
          count: {
            type: Number,
            default: 0,
          },
          percentage: {
            type: Number,
            default: 0,
          },
        },

        3: {
          count: {
            type: Number,
            default: 0,
          },
          percentage: {
            type: Number,
            default: 0,
          },
        },

        4: {
          count: {
            type: Number,
            default: 0,
          },
          percentage: {
            type: Number,
            default: 0,
          },
        },

        5: {
          count: {
            type: Number,
            default: 0,
          },
          percentage: {
            type: Number,
            default: 0,
          },
        },
      },
    },

    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "PENDING"],
      default: "PENDING",
    },

    // Cancellation policy (applied to all rooms)
    cancellationPolicy: {
      type: String,
      enum: ["FLEXIBLE", "MODERATE", "STRICT", "NON_REFUNDABLE"],
      default: "MODERATE",
    },
    couponCodes: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
    }, // e.g. ["SUMMER20", "WINTER15"]
    checkInTime: { type: String, default: "14:00" },
    checkOutTime: { type: String, default: "12:00" },
    contact: {
      email: String,
      phone: String,
    },

    // For dynamic pricing at hotel level (multiplier)
    dynamicPricingFactor: { type: Number, default: 1.0, min: 0.5, max: 2.0 },
  },
  { timestamps: true },
);

// Critical indexes
hotelSchema.index({ "address.city": 1, status: 1 });
hotelSchema.index({ geoLocation: "2dsphere" }); // enables $geoNear, $nearSphere
hotelSchema.index({ status: 1 });
hotelSchema.index({ averageRating: -1 });

// 👇 Important line
export default mongoose.models.Hotel || mongoose.model("Hotel", hotelSchema);
// export default Hotel;
