import Review from '../models/review.model.js';
// import Booking from '../models/booking.model.js';
import Hotel from '../models/hotel.model.js';

export const createReview = async (req, res) => {
  try {
    const { hotel, rating, comment, images = [] } = req.body;
    const userId = req.user._id;

    // Check if user has stayed at the hotel
    const bookingExists = await Booking.findOne({
      bookedById: userId,
      hotel,
      status: { $in: ['CHECKED_OUT', 'COMPLETED'] }
    });

    if (!bookingExists) {
      return res.status(400).json({
        success: false,
        message: 'You can only review after completing your stay'
      });
    }

    // Prevent multiple reviews
    const existingReview = await Review.findOne({ user: userId, hotel });
    if (existingReview) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this hotel' });
    }

    const review = await Review.create({
      user: userId,
      hotel,
      booking: bookingExists._id,
      rating,
      comment,
      images
    });

    // Update hotel average rating (async - can be moved to queue later)
    const stats = await Review.aggregate([
      { $match: { hotel } },
      { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);

    if (stats.length > 0) {
      await Hotel.findByIdAndUpdate(hotel, {
        averageRating: stats[0].avgRating.toFixed(1),
        reviewCount: stats[0].count
      });
    }

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      review
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getHotelReviews = async (req, res) => {
  try {
    const { hotelId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const reviews = await Review.find({ hotel: hotelId })
      .populate('user', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Review.countDocuments({ hotel: hotelId });

    res.status(200).json({
      success: true,
      total,
      totalPages: Math.ceil(total / limit),
      reviews
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ user: req.user._id })
      .populate('hotel', 'name address.city')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: reviews.length, reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};