import mongoose from "mongoose";

const seatSchema = new mongoose.Schema({
  seatNumber: { 
    type: String, 
    required: true 
  }, // e.g., "L1", "U5", "1A", "2W"
  
  row: { type: Number, required: true },
  column: { type: Number, required: true },
  
  deck: {
    type: String,
    enum: ["LOWER", "UPPER", "SINGLE"],
    required: true
  },
  
  section: {
    type: String,
    enum: ["LEFT", "RIGHT", "MIDDLE"],
  },
  
  type: {
    type: String,
    enum: ["SEATER", "SLEEPER", "SEMI_SLEEPER"],
    required: true
  },
  
  isWindow: { type: Boolean, default: false },
  isAisle: { type: Boolean, default: false },
  
  // 🔥 Useful new fields
  category: {
    type: String,
    enum: ["REGULAR", "PREMIUM", "LADIES", "SENIOR", "DISABLED"],
    default: "REGULAR"
  },
  
  basePrice: { type: Number }, // Optional: can override trip base price
}, { _id: false });

// Main Bus Schema
const busSchema = new mongoose.Schema({
  busNo: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },

  registrationNumber: {     // 🔥 Added - Very important
    type: String,
    required: true,
    unique: true
  },

  travelAgency: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Agency",
    required: true
  },

  busType: {
    type: String,
    enum: [
      "Seater",
      "AC Seater",
      "Non-AC Seater",
      "Sleeper",
      "AC Sleeper",
      "Non-AC Sleeper",
      "Semi-Sleeper",
      "Volvo",
      "Luxury"
    ],
    required: true
  },

  deckType: {
    type: String,
    enum: ["Single", "Double"],
    required: true
  },

  totalSeats: {
    type: Number,
    required: true
  },

  // 🔥 Better Seat Structure
  seatStructure: {
    seats: [seatSchema],           // Flat array of all seats (recommended)
    
    // Optional: Keep for quick UI rendering
    layout: {
      seater: {
        rows: Number,
        columns: Number,
        seatsPerRow: Number
      },
      sleeper: {
        lower: { rows: Number, columns: Number },
        upper: { rows: Number, columns: Number }
      }
    }
  },

  images: [{ type: String }],
  amenities: [{ type: String }],
  features: [{ type: String }],

  // 🔥 New Important Fields
  manufacturer: String,        // e.g., Volvo, Ashok Leyland
  model: String,
  year: Number,
  
  status: {
    type: String,
    enum: ["ACTIVE", "MAINTENANCE", "INACTIVE"],
    default: "ACTIVE"
  },

  baseFare: {                  // Base price per seat
    type: Number,
    required: true
  },

  // Pricing tiers (useful for dynamic pricing)
  priceTiers: {
    premium: { type: Number, default: 1.3 },   // 30% extra
    window: { type: Number, default: 1.1 },
    regular: { type: Number, default: 1 }
  },

  policies: {
    cancellationPolicy: String,
    boardingPolicy: String,
    refundPolicy: String
  },
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

  // Timestamps
}, { 
  timestamps: true 
});

// Optional: Pre-save hook to auto-calculate totalSeats
busSchema.pre('save', function () {
  if (this.seatStructure?.seats) {
    this.totalSeats = this.seatStructure.seats.length;
  }
});

const Bus = mongoose.model("Bus", busSchema);
export default Bus;