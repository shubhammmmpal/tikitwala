// roomAvailability.model.js
import mongoose from 'mongoose';

const roomAvailabilitySchema = new mongoose.Schema({
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true,
    index: true
  },
  
  // Store as full Date but always set to start-of-day (UTC) in service layer
  date: { 
    type: Date, 
    required: true 
  },
  
  // Core inventory fields (updated atomically)
  availableCount: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  
  heldCount: { 
    type: Number, 
    default: 0, 
    min: 0 
    // Temporary holds during checkout flow (cleared on timeout or confirmation)
  },
  
  // Dynamic pricing override per date
  priceOverride: { 
    type: Number, 
    min: 0 
    // If null → use Room.basePricePerNight
  },
  
  // Snapshot for audit & fast reads
  totalInventorySnapshot: { type: Number, required: true }
}, { timestamps: true });

// Critical compound unique index
roomAvailabilitySchema.index({ room: 1, date: 1 }, { unique: true });
roomAvailabilitySchema.index({ date: 1 }); // for date-range queries

// Virtual for real-time available rooms
roomAvailabilitySchema.virtual('realTimeAvailable').get(function() {
  return this.availableCount - this.heldCount;
});

const RoomAvailability =
  mongoose.models.RoomAvailability ||
  mongoose.model('RoomAvailability', roomAvailabilitySchema);

export default RoomAvailability;