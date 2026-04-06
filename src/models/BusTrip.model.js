import mongoose from 'mongoose';
const busTripSchema = new mongoose.Schema({
  bus: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bus',
    required: true
  },
  platformType: {
    type: String,
    default: 'BUS'
  },
  startPoint: {
    type: String,
    required: true
  },
  endPoint: {
    type: String,
    required: true
  },
  departureDateTime: {
    type: Date,
    required: true
  },
  arrivalDateTime: {
    type: Date,
    required: true
  },
  departureDate: {
    type: String,
    required: true
  },
  arrivalDate: {
    type: String,
    required: true
  },
  departureTime: {
    type: String,
    // required: true
  },
  arrivalTime: {
    type: String,
    // required: true
  },
  travelDuration: {
    type: String, // e.g., "8h 30m"
    required: true
  },

  // Pickup Points (multiple stops)
  pickupPoints: [{
    name: { type: String, required: true },
    datetime: { type: Date, required: true },
    order: { type: Number } // sequence of stop
  }],

  // Drop Points
  dropPoints: [{
    name: { type: String, required: true },
    datetime: { type: Date, required: true },
    order: { type: Number }
  }],

  // Seat Configuration
seats: [{
    seatNo: { type: String, required: true },
    
    deck: {
      type: String,
      enum: ['LOWER', 'UPPER', 'SINGLE'],   // ← Changed
      required: true
    },
    
    seatPrice: { type: Number, required: true },
    
    seatType: {
      type: String,
      enum: ['SEATER', 'SLEEPER', 'SEMI_SLEEPER'],   // ← Changed
      required: true
    },
    
    seatFor: {
      type: String,
      enum: ['Male', 'Female', 'None'],
      default: 'None'
    },
    
    status: {
      type: String,
      enum: ['available', 'booked', 'blocked'],
      default: 'available'
    },
    
    bookedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    genderBooked: { type: String, default: null }
  }],

  // Pricing (you can extend this)
  basePrice: { type: Number, required: true },
  pricePerSeat: { type: Map, of: Number }, // e.g., { "Upper": 1200, "Lower": 1500 }

  amenities: [{ type: String }],
  features: [{ type: String }],
  busImages: [{ type: String }],

  // Ratings (for this trip or overall bus)
  ratings: {
    average: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    distribution: {
      1: { count: Number, percentage: Number },
      2: { count: Number, percentage: Number },
      3: { count: Number, percentage: Number },
      4: { count: Number, percentage: Number },
      5: { count: Number, percentage: Number }
    }
  },

  status: {
    type: String,
    enum: ['active', 'cancelled', 'completed', 'delayed'],
    default: 'active'
  }
}, {
  timestamps: true // auto adds createdAt & updatedAt
});

const BusTrip = mongoose.model('BusTrip', busTripSchema);
export default BusTrip;