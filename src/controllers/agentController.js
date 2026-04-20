import HotelBooking from '../models/BookingHotel.model.js';
import AgentCommission from '../models/agentCommission.model.js';
// import User from '../models/user.model.js';

// Agent Dashboard
export const getAgentDashboard = async (req, res) => {
  try {
    const agentId = req.user._id;

    const totalBookings = await Booking.countDocuments({ bookedById: agentId });
    const totalRevenue = await Booking.aggregate([
      { $match: { bookedById: agentId, paymentStatus: 'PAID' } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);

    const pendingCommissions = await AgentCommission.aggregate([
      { $match: { agent: agentId, status: 'PENDING' } },
      { $group: { _id: null, total: { $sum: '$commissionAmount' } } }
    ]);

    const stats = {
      totalBookings,
      totalRevenueGenerated: totalRevenue[0]?.total || 0,
      pendingCommission: pendingCommissions[0]?.total || 0,
      walletBalance: req.user.walletBalance || 0
    };

    res.status(200).json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Commission History
export const getAgentCommissions = async (req, res) => {
  try {
    const commissions = await AgentCommission.find({ agent: req.user._id })
      .populate('booking', 'checkInDate checkOutDate totalPrice hotel')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: commissions.length,
      commissions
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Wallet & Transactions
export const getAgentWallet = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('walletBalance');

    const transactions = await AgentCommission.find({ agent: req.user._id })
      .select('commissionAmount status paidAt createdAt')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      walletBalance: user.walletBalance || 0,
      transactions
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Agent's Bookings
export const getAgentBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ bookedById: req.user._id })
      .populate('hotel', 'name address.city')
      .populate('customerId', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Request Withdrawal
export const requestWithdrawal = async (req, res) => {
  try {
    const { amount } = req.body;
    const agent = req.user;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid amount is required' });
    }

    if (amount > agent.walletBalance) {
      return res.status(400).json({ success: false, message: 'Insufficient wallet balance' });
    }

    // In real project: Create withdrawal request record + update wallet
    agent.walletBalance -= amount;
    await agent.save();

    res.status(200).json({
      success: true,
      message: 'Withdrawal request submitted successfully. Amount will be transferred in 3-5 business days.',
      remainingBalance: agent.walletBalance
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};