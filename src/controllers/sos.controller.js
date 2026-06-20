import SOS from "../models/sos.model.js";
import User from "../models/User.model.js";
import Camp from "../models/camp.model.js";
import Volunteer from "../models/volunteer.model.js";
import { getIO } from "../socket/socket.js";
import { calculateNearbySOSCount } from "../utils/helper.js";
import { getAffectedCamps } from "../utils/helper.js";
import { getDistanceInKm } from "../utils/helper.js";

export const createSOS = async (req, res) => {
  try {
    const sos = await SOS.create({
      userId: req.user.id,
      message: req.body.message,
      latitude: req.body.latitude,
      longitude: req.body.longitude,
      sosType: req.body.sosType,
    });

    const io = getIO();

    const affectedCamps = await getAffectedCamps(sos.latitude, sos.longitude);

    for (const camp of affectedCamps) {
      const missedSOSCount = await SOS.countDocuments({
        latitude: { $exists: true },
        longitude: { $exists: true },
      });

      io.to("all-camps").emit("camp-sos-count-updated", {
        campId: camp._id,
        campName: camp.campName,
        missedSOSCount,
      });
    }

    return res.status(201).json({
      success: true,
      data: sos,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getPendingSOS = async (req, res) => {
  try {
    const sos = await SOS.find({
      status: "pending",
    }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      data: sos,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const acceptSOS = async (req, res) => {
  try {
    const campId = req.user.campId;

    const sos = await SOS.findOneAndUpdate(
      {
        _id: req.params.sosId,
        status: "pending",
      },
      {
        status: "accepted",
        assignedCamp: campId,
        acceptedAt: new Date(),
      },
      {
        new: true,
      },
    );

    if (!sos) {
      return res.status(400).json({
        success: false,
        message: "SOS already accepted",
      });
    }

    getIO().to("all-camps").emit("sos-accepted", {
      sosId: sos._id,
      assignedCamp: campId,
    });

    return res.status(200).json({
      success: true,
      data: sos,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getMyAssignedSOS = async (req, res) => {
  try {
    const campId = req.user.campId;

    const sos = await SOS.find({
      assignedCamp: campId,
      status: "accepted",
    });

    return res.status(200).json({
      success: true,
      data: sos,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAgentSOS = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    const { campType, sosType, status } = req.query;

    let camps = [];

    // =========================
    // AGENT
    // =========================
    if (role === "CAMP_AGENT") {
      const campFilter = {
        createdBy: userId,
      };

      if (campType) {
        campFilter.campType = campType;
      }

      camps = await Camp.find(campFilter);
    }

    // =========================
    // VOLUNTEER
    // =========================
    else if (role === "Volunteer") {
      const volunteer = await Volunteer.findOne({
        _id: userId,
      });

      if (!volunteer) {
        return res.status(404).json({
          success: false,
          message: "Volunteer not found",
        });
      }

      const camp = await Camp.findById(volunteer.campId);

      if (!camp) {
        return res.status(404).json({
          success: false,
          message: "Camp not found",
        });
      }

      if (campType && camp.campType !== campType) {
        return res.status(200).json({
          success: true,
          count: 0,
          data: [],
        });
      }

      camps = [camp];
    }

    // =========================
    // INVALID ROLE
    // =========================
    else {
      return res.status(403).json({
        success: false,
        message: "Unauthorized role",
      });
    }

    if (!camps.length) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
      });
    }

    // =========================
    // SOS FILTER
    // =========================
    const sosFilter = {
      rejectedBy: {
        $nin: [userId],
      },
    };

    if (sosType) {
      sosFilter.sosType = sosType;
    }

    if (status) {
      sosFilter.status = status;
    }

    const allSOS = await SOS.find(sosFilter)
      .populate("userId", "name phone profileImage")
      .populate("assignedCamp", "campName campType")
      .populate("volunteerId", "name phone");

    const uniqueSOS = new Map();

    for (const camp of camps) {
      for (const sos of allSOS) {
        const distance = getDistanceInKm(
          camp.latitude,
          camp.longitude,
          sos.latitude,
          sos.longitude,
        );

        if (distance <= 5) {
          const sosId = sos._id.toString();

          if (!uniqueSOS.has(sosId)) {
            uniqueSOS.set(sosId, {
              ...sos.toObject(),
              distance: Number(distance.toFixed(2)),
              nearbyCamp: {
                _id: camp._id,
                campName: camp.campName,
                campType: camp.campType,
              },
            });
          }
        }
      }
    }

    return res.status(200).json({
      success: true,
      count: uniqueSOS.size,
      data: Array.from(uniqueSOS.values()),
    });
  } catch (error) {
    console.error("getAgentSOS Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const approveSOS = async (req, res) => {
  try {
    // console.log(req.user)
    // return
    const userId = req.user.id;
    const role = req.user.role;

    const { sosId } = req.params;

    const sos = await SOS.findById(sosId);

    if (!sos) {
      return res.status(404).json({
        success: false,
        message: "SOS not found",
      });
    }

    // Already approved
    if (sos.status === "accepted") {
      return res.status(400).json({
        success: false,
        message: "SOS already approved",
      });
    }

    // Already resolved
    if (sos.status === "resolved") {
      return res.status(400).json({
        success: false,
        message: "SOS already resolved",
      });
    }

    // =====================
    // AGENT APPROVAL
    // =====================
    if (role === "CAMP_AGENT") {
      const camp = await Camp.findOne({
        createdBy: userId,
      });

      if (!camp) {
        return res.status(404).json({
          success: false,
          message: "Camp not found",
        });
      }

      if (sos.rejectedBy.some((id) => id.toString() === camp._id.toString())) {
        return res.status(400).json({
          success: false,
          message: "This camp has already rejected this SOS",
        });
      }

      sos.assignedCamp = camp._id;
      sos.assigned = true;
      sos.status = "accepted";
      sos.acceptedAt = new Date();
    }

    // =====================
    // VOLUNTEER APPROVAL
    // =====================
    else if (role === "Volunteer") {
      const volunteer = await Volunteer.findOne({
        _id: userId,
      });

      if (!volunteer) {
        return res.status(404).json({
          success: false,
          message: "Volunteer not found",
        });
      }

      const volunteerRejected = sos.rejectedBy.some(
        (id) => id.toString() === volunteer._id.toString(),
      );

      const campRejected = sos.rejectedBy.some(
        (id) => id.toString() === volunteer.campId.toString(),
      );

      if (volunteerRejected || campRejected) {
        return res.status(400).json({
          success: false,
          message:
            "You cannot approve this SOS because it was previously rejected",
        });
      }

      sos.assignedCamp = volunteer.campId;
      sos.volunteerId = volunteer._id;
      sos.assigned = true;
      sos.status = "accepted";
      sos.acceptedAt = new Date();
    } else {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    await sos.save();

    return res.status(200).json({
      success: true,
      message: "SOS approved successfully",
      data: sos,
    });
  } catch (error) {
    console.error("approveSOS Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const rejectSOS = async (req, res) => {
  try {
    console.log(req.user);
    const userId = req.user.id;
    const role = req.user.role;

    const { sosId } = req.params;

    const sos = await SOS.findById(sosId);

    if (!sos) {
      return res.status(404).json({
        success: false,
        message: "SOS not found",
      });
    }

    // Once approved nobody can reject
    if (sos.status === "accepted") {
      return res.status(400).json({
        success: false,
        message: "Approved SOS cannot be rejected",
      });
    }

    // =========================
    // AGENT
    // =========================
    if (role === "CAMP_AGENT") {
      const camp = await Camp.findOne({
        createdBy: userId,
      });

      if (!camp) {
        return res.status(404).json({
          success: false,
          message: "Camp not found",
        });
      }

      const alreadyRejected = sos.rejectedBy.some(
        (id) => id.toString() === camp._id.toString(),
      );

      if (alreadyRejected) {
        return res.status(400).json({
          success: false,
          message: "Camp already rejected this SOS",
        });
      }

      sos.rejectedBy.push(camp._id);
    }

    // =========================
    // VOLUNTEER
    // =========================
    else if (role === "Volunteer") {
      const volunteer = await Volunteer.findOne({
        _id: userId,
      });

      if (!volunteer) {
        return res.status(404).json({
          success: false,
          message: "Volunteer not found",
        });
      }

      const volunteerRejected = sos.rejectedBy.some(
        (id) => id.toString() === volunteer._id.toString(),
      );

      const campRejected = sos.rejectedBy.some(
        (id) => id.toString() === volunteer.campId.toString(),
      );

      if (volunteerRejected || campRejected) {
        return res.status(400).json({
          success: false,
          message: "Volunteer or camp already rejected this SOS",
        });
      }

      sos.rejectedBy.push(
        // volunteer._id,
        volunteer.campId,
      );
    } else {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    await sos.save();

    return res.status(200).json({
      success: true,
      message: "SOS rejected successfully",
      data: sos,
    });
  } catch (error) {
    console.error("rejectSOS Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const transferSOS = async (req, res) => {
  try {
    const userId = req.user._id;
    const role = req.user.role;
    const { latitude, longitude } = req.body;

    const { sosId } = req.params;

    const sos = await SOS.findById(sosId);

    if (!sos) {
      return res.status(404).json({
        success: false,
        message: "SOS not found",
      });
    }

    let campId;

    // Agent
    if (role === "CAMP_AGENT") {
      const camp = await Camp.findOne({
        createdBy: userId,
      });

      if (!camp) {
        return res.status(404).json({
          success: false,
          message: "Camp not found",
        });
      }

      campId = camp._id;
    }

    // Volunteer
    else if (role === "Volunteer") {
      const volunteer = await Volunteer.findById(userId);

      if (!volunteer) {
        return res.status(404).json({
          success: false,
          message: "Volunteer not found",
        });
      }

      campId = volunteer.campId;
    } else {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Only assigned camp can transfer
    if (sos.assignedCamp && sos.assignedCamp.toString() !== campId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only assigned camp can transfer this SOS",
      });
    }

    // Transfer SOS
    sos.status = "pending";
    sos.assigned = false;
    sos.assignedCamp = null;
    sos.volunteerId = null;
    sos.rejectedBy = [];
    sos.transferredBy = campId;
    sos.latitude = latitude;
    sos.longitude = longitude;

    await sos.save();

    // Get camp details
    const camp = await Camp.findById(campId);

    if (camp) {
      // Count all SOS within 5km radius
      const allSOS = await SOS.find();

      let totalSOS = 0;

      for (const item of allSOS) {
        const distance = getDistanceInKm(
          camp.latitude,
          camp.longitude,
          item.latitude,
          item.longitude,
        );

        if (distance <= 5) {
          totalSOS++;
        }
      }

      // Emit dashboard update
      getIO().to("all-camps").emit("camp-sos-count-updated", {
        campId: camp._id,
        campName: camp.campName,
        totalSOS,
        missed: "missed",
      });
    }

    return res.status(200).json({
      success: true,
      message: "SOS transferred successfully",
      data: sos,
    });
  } catch (error) {
    console.error("transferSOS Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getSOSByCamp = async (req, res) => {
  try {
    const { campId } = req.params;

    const sosList = await SOS.find({
      assignedCamp: campId,
    })
      .populate("userId", "name phone")
      .populate("assignedCamp", "campName campType")
      .populate("volunteerId", "name phone");

    return res.status(200).json({
      success: true,
      count: sosList.length,
      data: sosList,
    });
  } catch (error) {
    console.error("getSOSByCamp Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
