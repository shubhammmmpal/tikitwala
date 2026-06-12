import mongoose from "mongoose";


// ======================
// Pickup Point Schema
// ======================

const pickupPointSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  datetime: {
    type: Date,
    required: true
  },

  address: {
    type: String
  }
}, { _id: false });


// ======================
// Drop Point Schema
// ======================

const dropPointSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  datetime: {
    type: Date,
    required: true
  },

  address: {
    type: String
  }
}, { _id: false });


// ======================
// City Wise Pickup Schema
// ======================

const cityPickupSchema = new mongoose.Schema({
  city: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "City",
    required: true
  },

  points: [pickupPointSchema]

}, { _id: false });


// ======================
// City Wise Drop Schema
// ======================

const cityDropSchema = new mongoose.Schema({
  city: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "City",
    required: true
  },

  points: [dropPointSchema]

}, { _id: false });


// ======================
// Stop Point Schema
// ======================

const stopPointSchema = new mongoose.Schema({
  city: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "City",
    required: true
  },

  arrivalTime: {
    type: Date
  },

  departureTime: {
    type: Date
  },

  order: {
    type: Number,
    required: true
  }

}, { _id: false });


// ======================
// Seat Schema
// ======================

const seatSchema = new mongoose.Schema({

  seatNo: {
    type: String,
    required: true
  },

  seatName:{
    type: String,
    required: true
  },
  deck: {
    type: String,
    enum: ['LOWER', 'UPPER', 'SINGLE'],
    required: true
  },

  seatPrice: {
    type: Number,
    required: true
  },

  seatType: {
    type: String,
    enum: ['SEATER', 'SLEEPER', 'SEMI_SLEEPER'],
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

  bookedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  genderBooked: {
    type: String,
    default: null
  }

}, { _id: false });


// ======================
// Main Bus Trip Schema
// ======================

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

  tripCode :{
    type: String,
  },

  // ======================
  // ROUTE
  // ======================

  startPoint: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'City',
    required: true
  },

  endPoint: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'City',
    required: true
  },

  stopPoints: [stopPointSchema],


  // ======================
  // DATE & TIME
  // ======================

  departureDateTime: {
    type: Date,
    // required: true
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
    type: String
  },

  arrivalTime: {
    type: String
  },

  travelDuration: {
    type: String,
    required: true
  },

  creationType:{
    type: String,
    enum: ['random', 'daily'],
    
  },
  
  dates: [Date], // For random generation of trips on specific dates



  // ======================
  // PICKUP & DROP POINTS
  // ======================

  pickupPoints: [cityPickupSchema],

  dropPoints: [cityDropSchema],


  // ======================
  // SEATS
  // ======================

  seats: [seatSchema],


  // ======================
  // PRICING
  // ======================

  basePrice: {
    type: Number,
    required: true
  },

  pricePerSeat: {
    type: Map,
    of: Number
  },


  // ======================
  // EXTRA
  // ======================

  amenities: [{
    type: String
  }],

  features: [{
    type: String
  }],

  busImages: [{
    type: String
  }],


  // ======================
  // RATINGS
  // ======================

  ratings: {

    average: {
      type: Number,
      default: 0
    },

    totalReviews: {
      type: Number,
      default: 0
    },

    distribution: {

      1: {
        count: Number,
        percentage: Number
      },

      2: {
        count: Number,
        percentage: Number
      },

      3: {
        count: Number,
        percentage: Number
      },

      4: {
        count: Number,
        percentage: Number
      },

      5: {
        count: Number,
        percentage: Number
      }
    }
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },


  // ======================
  // STATUS
  // ======================

  status: {
    type: String,
    enum: ['active', 'cancelled', 'completed', 'delayed'],
    default: 'active'
  }

}, {
  timestamps: true
});


// ======================
// MODEL
// ======================

const BusTrip = mongoose.model('BusTrip', busTripSchema);

export default BusTrip;