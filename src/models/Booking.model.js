import mongoose from "mongoose";

const passengerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  gender: { type: String, enum: ["Male", "Female", "Other"], required: true },
  age: { type: Number, required: true },
  seatNo: { type: String, required: true },           // e.g., "12 Upper deck"
  deck: { type: String, enum: ["LOWER", "UPPER", "SINGLE"] },
  seatType: { type: String }                          // Seater / Sleeper
});

const fareBreakupSchema = new mongoose.Schema({
  baseFare: { type: Number, required: true },
  gst: { type: Number, default: 0 },
  platformFee: { type: Number, default: 0 },
  otherCharges: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true }
});

const bookingSchema = new mongoose.Schema({
  bookingId: {
    type: String,
    unique: true,
    // required: true
  },

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    // required: true
  },

  busTrip: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "BusTrip",
    required: true
  },

  // Bus Details
  bus: {
    busNo: String,
    busType: String,
    travelAgency: String
  },

  // Journey Details
  startPoint: { type: String, required: true },
  endPoint: { type: String, required: true },

  departureDateTime: { type: Date, required: true },
  arrivalDateTime: { type: Date, required: true },

  departureDate: String,
  departureTime: String,
  arrivalDate: String,
  arrivalTime: String,

  travelDuration: String, 
         // e.g., "15hr 30min"
  pickupPoints: {
    name: { type: String, required: true },
    datetime: { type: Date, required: true },
    order: { type: Number } // sequence of stop
  },

  // Drop Points
  dropPoints: {
    name: { type: String, required: true },
    datetime: { type: Date, required: true },
    order: { type: Number }
  },

  // Passengers
  passengers: [passengerSchema],
  totalPassengers: { type: Number, required: true },

  // Contact Details
  contactEmail: { type: String, required: true },
  contactPhone: { type: String, required: true },

  // Fare Details
  fareBreakup: fareBreakupSchema,

  // Payment Info
  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "failed", "refunded"],
    default: "pending"
  },
  paymentId: String,
  transactionId: String,

  // Booking Status
  status: {
    type: String,
    enum: ["confirmed", "cancelled", "completed", "pending"],
    default: "confirmed"
  },

  // Additional Info
  seatType: String,              // e.g., "A/C Sleeper (2+1)"
  totalSeatsBooked: { type: Number, required: true },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Generate unique Booking ID before saving
bookingSchema.pre("save", async function () {
  if (!this.bookingId) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(2);
    this.bookingId = `BK${year}${Math.floor(100000 + Math.random() * 900000)}`;
  }
});

const Booking = mongoose.model("Booking", bookingSchema);
export default Booking;