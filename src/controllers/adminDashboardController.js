// import Booking from '../models/booking.model.js';
import Hotel from '../models/hotel.model.js';
// import User from '../models/user.model.js';
import Payment from '../models/payment.model.js';

export const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const totalBookings = await Booking.countDocuments();
    const confirmedBookings = await Booking.countDocuments({ status: 'CONFIRMED' });
    const totalRevenue = await Payment.aggregate([
      { $match: { status: 'SUCCESS' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const monthlyRevenue = await Payment.aggregate([
      { $match: { status: 'SUCCESS', createdAt: { $gte: firstDayOfMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const totalUsers = await User.countDocuments();
    const totalHotels = await Hotel.countDocuments({ status: 'ACTIVE' });

    const stats = {
      totalBookings,
      confirmedBookings,
      totalRevenue: totalRevenue[0]?.total || 0,
      monthlyRevenue: monthlyRevenue[0]?.total || 0,
      totalUsers,
      totalHotels,
      occupancyRate: "78%"   // Can be calculated dynamically later
    };

    res.status(200).json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getRevenueAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const revenue = await Payment.aggregate([
      {
        $match: {
          status: 'SUCCESS',
          createdAt: {
            $gte: new Date(startDate || '2025-01-01'),
            $lte: new Date(endDate || Date.now())
          }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$amount" },
          bookings: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({ success: true, revenue });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getOccupancyReport = async (req, res) => {
  try {
    // Simple occupancy report (can be enhanced with RoomAvailability)
    const occupancy = await Booking.aggregate([
      {
        $match: {
          status: { $in: ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT'] }
        }
      },
      {
        $group: {
          _id: "$hotel",
          totalBookings: { $sum: 1 },
          totalRevenue: { $sum: "$totalPrice" }
        }
      },
      {
        $lookup: {
          from: "hotels",
          localField: "_id",
          foreignField: "_id",
          as: "hotelInfo"
        }
      }
    ]);

    res.status(200).json({ success: true, occupancy });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getBookingReports = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('hotel', 'name')
      .populate('bookedById', 'firstName lastName role')
      .sort({ createdAt: -1 })
      .limit(100);

    res.status(200).json({ success: true, bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};