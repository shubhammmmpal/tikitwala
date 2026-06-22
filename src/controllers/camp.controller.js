import Camp from "../models/camp.model.js";
import User from "../models/User.model.js";
import fs from "fs";
import { getDistanceInKm } from "../utils/helper.js";
import { getIO } from "../socket/socket.js";
import Volunteer from "../models/volunteer.model.js"
import SOS from "../models/sos.model.js"

export const getNearbyActiveUsers = async (req, res) => {
try {

    const agentId = req.user.id;

    const camps = await Camp.find({
      createdBy: agentId
    });

    if (!camps.length) {
      return res.status(200).json({
        success: true,
        totalUsers: 0
      });
    }

    const users = await User.find({
      role: "user",
      "activeLocation.latitude": { $exists: true },
      "activeLocation.longitude": { $exists: true }
    }).select("activeLocation");

    const uniqueUsers = new Set();

    for (const camp of camps) {

      for (const user of users) {

        const distance = getDistanceInKm(
          camp.latitude,
          camp.longitude,
          user.activeLocation.latitude,
          user.activeLocation.longitude
        );

        if (distance <= 5) {
          uniqueUsers.add(user._id.toString());
        }
      }
    }

    return res.status(200).json({
      success: true,
      totalUsers: uniqueUsers.size
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message
    });

  }
};


export const createCamp = async (req, res) => {
  try {
    const userId = req.body.id;

     // Check if agent already created a camp
    const existingCamp = await Camp.findOne({
      createdBy: userId,
    });

    if (existingCamp) {
      return res.status(400).json({
        success: false,
        message: "You have already created a camp. Multiple camps are not allowed.",
      });
    }

    const {
      campName,
      campType,
      phone,
      stallno,
      icon,
      latitude,
      longitude,
      description,
    } = req.body;

    const images = req.files
      ? req.files.map((file) => file.path)
      : [];

    const camp = await Camp.create({
      campName,
      campType,
      phone,
      stallno,
      icon,
      image: images,
      latitude,
      longitude,
      description,
      createdBy: userId,
    });

    // Get latest count
    const totalCamps = await Camp.countDocuments();

    // Emit to all dashboard users
    const io = getIO();

    io.to("all-camps").emit("camp-count-updated", {
      totalCamps,
    });

    return res.status(201).json({
      success: true,
      message: "Camp created successfully",
      data: camp,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get All Camps
export const getAllCamps = async (req, res) => {
  try {
    const camps = await Camp.find()
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: camps.length,
      data: camps
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get Single Camp
export const getCampsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const camps = await Camp.find({
      createdBy: userId
    }).populate("createdBy", "name email");

    return res.status(200).json({
      success: true,
      count: camps.length,
      data: camps
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getCampById = async (req, res) => {
  try {
    const camp = await Camp.findById(req.params.id)
      .populate("createdBy", "name email");

    if (!camp) {
      return res.status(404).json({
        success: false,
        message: "Camp not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: camp
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update Camp
export const updateCamp = async (req, res) => {
  try {

    const camp = await Camp.findById(req.params.id);

    if (!camp) {
      return res.status(404).json({
        success: false,
        message: "Camp not found"
      });
    }

    const {
      campName,
      campType,
      phone,
      stallno,
      icon,
      latitude,
      longitude,
      description
    } = req.body;

    let images = camp.image;

    if (req.files && req.files.length > 0) {

      // delete old images
      camp.image.forEach((img) => {
        if (fs.existsSync(img)) {
          fs.unlinkSync(img);
        }
      });

      images = req.files.map(file => file.path);
    }

    const updatedCamp = await Camp.findByIdAndUpdate(
      req.params.id,
      {
        campName,
        campType,
        phone,
        stallno,
        icon,
        image: images,
        latitude,
        longitude,
        description
      },
      {
        new: true,
        runValidators: true
      }
    );

    return res.status(200).json({
      success: true,
      message: "Camp updated successfully",
      data: updatedCamp
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete Camp
export const deleteCamp = async (req, res) => {
  try {
    const camp = await Camp.findById(req.params.id);

    if (!camp) {
      return res.status(404).json({
        success: false,
        message: "Camp not found"
      });
    }

    // Delete Images
    if (camp.image?.length) {
      camp.image.forEach((img) => {
        if (fs.existsSync(img)) {
          fs.unlinkSync(img);
        }
      });
    }

    await Camp.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Camp deleted successfully"
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


export const campDashboard = async (req, res) => {
  try {
    let camps = [];

    if (req.user.role === "CAMP_AGENT") {
      camps = await Camp.find({
        createdBy: req.user.id,
      });
    }

    if (req.user.role === "Volunteer") {
      const volunteer = await Volunteer.findById(req.user.id);

      if (!volunteer) {
        return res.status(404).json({
          success: false,
          message: "Volunteer not found",
        });
      }

      camps = await Camp.find({
        _id: volunteer.campId,
      });
    }

    if (!camps.length) {
      return res.status(200).json({
        success: true,
        totalActiveUsers: 0,
      });
    }

    const users = await User.find({
      "activeLocation.latitude": { $exists: true },
      "activeLocation.longitude": { $exists: true },
    });

    const uniqueUsers = new Set();

    for (const camp of camps) {
      for (const user of users) {
        const distance = getDistanceInKm(
          camp.latitude,
          camp.longitude,
          user.activeLocation.latitude,
          user.activeLocation.longitude
        );

        if (distance <= 5) {
          uniqueUsers.add(user._id.toString());
        }
      }
    }

    const sosList = await SOS.find();

const uniqueSOS = new Set();

for (const camp of camps) {
  for (const sos of sosList) {
    const distance = getDistanceInKm(
      camp.latitude,
      camp.longitude,
      sos.latitude,
      sos.longitude
    );

    if (distance <= 5) {
      uniqueSOS.add(sos._id.toString());
    }
  }
}

const totalNearbySOS = uniqueSOS.size;

const acceptedSOSList = await SOS.find({
  status: "accepted",
});

const uniqueAcceptedSOS = new Set();

for (const camp of camps) {
  for (const sos of acceptedSOSList) {
    const distance = getDistanceInKm(
      camp.latitude,
      camp.longitude,
      sos.latitude,
      sos.longitude
    );

    if (distance <= 5) {
      uniqueAcceptedSOS.add(sos._id.toString());
    }
  }
}

const acceptedSOSCount = uniqueAcceptedSOS.size;

const campIds = camps.map(camp => camp._id);

const totalVolunteerCount = await Volunteer.countDocuments({
  campId: { $in: campIds }
});

    const totalCampCount = await Camp.countDocuments();

    return res.status(200).json({
      success: true,
      totalActiveUsers: uniqueUsers.size || 0,
      totalCampCount:totalCampCount || 0,
      totalNearbySOS: totalNearbySOS || 0,
      acceptedSOSCount : acceptedSOSCount || 0,
      totalVolunteerCount: totalVolunteerCount || 0,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};