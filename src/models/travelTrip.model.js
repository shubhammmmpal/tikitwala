import mongoose from "mongoose";

const travelTripSchema = new mongoose.Schema({
//   tripId: {
//     type: String,
//     unique: true,
//     // required: true
//   },
  tripName: String,
  dayCount: Number,
  nightCount: Number,
  description: String,
  cityIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "City" }],
  price: Number,
  discountPrice: Number,
  images: [String],
  vibe: [String], // e.g., "Adventure", "Relaxation", "Cultural"
  budget: String, // e.g., "Budget", "Mid-range", "Luxury"
  madeFor: [String], // e.g., "Couples", "Families", "Solo Travelers"
  inclusions: [String],

  ratings: {
    average: { 
      type: Number, 
      default: 0,
      min: 0,
      max: 5 
    },
    totalReviews: { 
      type: Number, 
      default: 0 
    },
    distribution: {
      1: { count: { type: Number, default: 0 }, percentage: { type: Number, default: 0 } },
      2: { count: { type: Number, default: 0 }, percentage: { type: Number, default: 0 } },
      3: { count: { type: Number, default: 0 }, percentage: { type: Number, default: 0 } },
      4: { count: { type: Number, default: 0 }, percentage: { type: Number, default: 0 } },
      5: { count: { type: Number, default: 0 }, percentage: { type: Number, default: 0 } }
    }
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, {
  timestamps: true,
});

export default mongoose.model("TravelTrip", travelTripSchema);