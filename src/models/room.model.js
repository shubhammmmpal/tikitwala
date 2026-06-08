// room.model.js
import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
  hotel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel',
    required: true,
    index: true
  },
  
  roomType: {
    type: String,
    required: true,
    enum: ['STANDARD', 'DELUXE', 'EXECUTIVE', 'SUITE', 'VILLA', 'PREMIUM', 'OTHER']
  },
  roomSize:{
    type:String
  },
  bedType:{
    type:String
  },
  
  name: { type: String, required: true }, // e.g. "Deluxe King Room"
  description: String,
  
  basePricePerNight: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  discountPricePerNight: {
    type: Number,
    min: 0,
    validate: {
      validator: function(value) {
        return value < this.basePricePerNight;
      },
      message: 'Discount price must be less than base price'
    }
  },
  taxesAndFees: {
    type: Number,
    min: 0,
    default: 0
  },
  withBreakfastPricePerNight: {
    type: Number,
    min: 0,
    default: 0
  },
  capacity: {
    adults: { type: Number, required: true, min: 1 },
    children: { type: Number, default: 0, min: 0 }
  },
  
  maxOccupancy: { type: Number, required: true },
  
  amenities: [String],
  
  images: [{
    url: String,
    caption: String
  }],
  
  totalInventory: { 
    type: Number, 
    required: true, 
    min: 1 
  },
  
  status: {
    type: String,
    enum: ['ACTIVE', 'MAINTENANCE', 'INACTIVE'],
    default: 'ACTIVE'
  }
}, { timestamps: true });

roomSchema.index({ hotel: 1, roomType: 1 });
roomSchema.index({ status: 1 });

const Room = mongoose.model('Room', roomSchema);
export default Room;