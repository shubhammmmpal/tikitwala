import Wishlist from '../models/wishlist.model.js';

export const getWishlist = async (req, res) => {
  try {
    const wishlist = await Wishlist.find({ user: req.user._id })
      .populate('hotel', 'name address images averageRating amenities')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: wishlist.length,
      wishlist
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addToWishlist = async (req, res) => {
  try {
    const { hotelId } = req.body;

    // Check if already in wishlist
    const exists = await Wishlist.findOne({ user: req.user._id, hotel: hotelId });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Hotel already in wishlist' });
    }

    const wishlistItem = await Wishlist.create({
      user: req.user._id,
      hotel: hotelId
    });

    res.status(201).json({
      success: true,
      message: 'Hotel added to wishlist',
      wishlistItem
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const removeFromWishlist = async (req, res) => {
  try {
    const result = await Wishlist.findOneAndDelete({
      user: req.user._id,
      hotel: req.params.hotelId
    });

    if (!result) {
      return res.status(404).json({ success: false, message: 'Hotel not found in wishlist' });
    }

    res.status(200).json({
      success: true,
      message: 'Hotel removed from wishlist'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};