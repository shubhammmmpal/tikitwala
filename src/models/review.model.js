// review.model.js
import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  hotel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel',
    required: true
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking' // ensures review only after stay
  },
  
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  
  comment: {
    type: String,
    maxlength: 500
  },
  
  images: [String]
}, { timestamps: true });

reviewSchema.index({ hotel: 1, user: 1 }, { unique: true }); // one review per user per hotel
reviewSchema.index({ hotel: 1, rating: -1 });

const Review = mongoose.model('Review', reviewSchema);
export default Review;