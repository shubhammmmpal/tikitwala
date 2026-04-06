import mongoose from "mongoose";

const agencySchema = new mongoose.Schema(
  {
    // Basic Info
    name: {
      type: String,
      required: [true, "Agency name is required"],
      unique: true,
      trim: true,
    },
    shortName: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },

    // Contact Info
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    secondaryPhone: {
      type: String,
      trim: true,
    },
    website: {
      type: String,
      trim: true,
    },

    // Address
    address: {
      street: { type: String, trim: true },
      city: { type: String, required: [true, "City is required"], trim: true },
      state: {
        type: String,
        required: [true, "State is required"],
        trim: true,
      },
      pincode: {
        type: String,
        required: [true, "Pincode is required"],
        trim: true,
      },
      country: { type: String, default: "India", trim: true },
    },

    // Business Details
    gstNumber: {
      type: String,
      trim: true,
      uppercase: true,
    },
    panNumber: {
      type: String,
      trim: true,
      uppercase: true,
    },
    registrationNumber: {
      type: String,
      trim: true,
      uppercase: true,
    },
    logo: {
      type: String, // logo URL
    },
    rating: {
      type: Number,
      min: [0, "Rating cannot be less than 0"],
      max: [5, "Rating cannot be more than 5"],
      default: 0,
    },

    // Operational
    isActive: {
      type: Boolean,
      default: true,
    },
    operatingRoutes: [
      {
        type: String,
        trim: true,
      },
    ],

    // Timestamps
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Indexes for better query performance
agencySchema.index({ city: 1 });
agencySchema.index({ rating: -1 });
agencySchema.index({ isActive: 1 });
agencySchema.index({ name: "text", description: "text" });

// Virtual: total buses count
agencySchema.virtual("totalBuses", {
  ref: "Bus",
  localField: "_id",
  foreignField: "travelAgency",
  count: true,
});

// Pre-save middleware: auto-update shortName if not provided
agencySchema.pre("save", function () {
  if (!this.shortName && this.name) {
    this.shortName = this.name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 5);
  }
});

const Agency = mongoose.model("Agency", agencySchema);

export default Agency;
