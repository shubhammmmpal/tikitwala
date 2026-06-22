import HotelAgentDashboard from "../models/hotelAgentDashboard.model.js";

export const getHotelAgentDashboard = async (req, res) => {
  try {
    const agentId = req.user._id;
    const role = req.user.role;

    if (role !== "HOTEL_AGENT") {
      return res.status(403).json({
        success: false,
        message: "Only hotel agents can access dashboard"
      });
    }

    let dashboard = await HotelAgentDashboard.findOne({ agentId });

    if (!dashboard) {
      dashboard = {
        totalBookedRooms: 0,
        totalRevenue: 0,
        currentMonthRevenue: 0,
        currentMonthBookedRooms: 0,
        todayRevenue: 0,
        todayBookedRooms: 0
      };
    }

    return res.status(200).json({
      success: true,
      dashboard
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};