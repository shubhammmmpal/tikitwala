import BusAgentDashboard from "../models/busAgentDashboard.model.js";



export const getBusDashboardByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const dashboard = await BusAgentDashboard.findOne({
      agentId: userId
    }).populate("agentId", "name email phone");

    if (!dashboard) {
      return res.status(404).json({
        success: false,
        message: "Dashboard not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: dashboard
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


export const getBusDashboardById = async (req, res) => {
  try {
    const { id } = req.params;

    const dashboard = await BusAgentDashboard.findById(id)
      .populate("agentId", "name email phone");

    if (!dashboard) {
      return res.status(404).json({
        success: false,
        message: "Dashboard not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: dashboard
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getAllBusDashboards = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      sortBy = "createdAt",
      sortOrder = "desc"
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    let query = {};

    if (search) {
      const users = await User.find({
        $or: [
          {
            name: {
              $regex: search,
              $options: "i"
            }
          },
          {
            email: {
              $regex: search,
              $options: "i"
            }
          }
        ]
      }).select("_id");

      query.agentId = {
        $in: users.map((u) => u._id)
      };
    }

    const dashboards = await BusAgentDashboard.find(query)
      .populate("agentId", "name email phone")
      .sort({
        [sortBy]: sortOrder === "asc" ? 1 : -1
      })
      .skip(skip)
      .limit(Number(limit));

    const total = await BusAgentDashboard.countDocuments(query);

    return res.status(200).json({
      success: true,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      data: dashboards
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};