import Inquiry from "../models/inquiry.model.js";
import mongoose from "mongoose";

export const createInquiry = async (req, res) => {
  try {
    const {
      travelTripId,
      userid,
      travellers,
      datefrom,
      dateto,
      name,
      phone,
    } = req.body;

    // Validation
    if (
      !travelTripId ||
      !userid ||
      !travellers ||
      !datefrom ||
      !dateto ||
      !name ||
      !phone
    ) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields",
      });
    }

    // ObjectId validation
    if (
      !mongoose.Types.ObjectId.isValid(travelTripId) ||
      !mongoose.Types.ObjectId.isValid(userid)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid ObjectId",
      });
    }

    // Create inquiry
    const inquiry = await Inquiry.create({
      travelTripId,
      userid,
      travellers,
      datefrom,
      dateto,
      name,
      phone,
    });

    return res.status(201).json({
      success: true,
      message: "Inquiry created successfully",
      data: inquiry,
    });
  } catch (error) {
    console.log("Create Inquiry Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// GET ALL INQUIRIES
export const getAllInquiryList = async (req, res) => {
  try {
    const inquiries = await Inquiry.find()
        .populate({
        path: "travelTripId",
        populate: {
        path: "cityIds",
        model: "City",
        select: "city_name"
        }
    })
      .populate("userid")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      total: inquiries.length,
      data: inquiries,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET INQUIRY BY ID
export const getInquiryById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid inquiry id",
      });
    }

    const inquiry = await Inquiry.findById(id)
        .populate({
    path: "travelTripId",
    populate: {
      path: "cityIds",
      model: "City",
      select: "city_name"
    }
  })
      .populate("userid");

    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: "Inquiry not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: inquiry,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// UPDATE INQUIRY
export const updateInquiry = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid inquiry id",
      });
    }

    const updatedInquiry = await Inquiry.findByIdAndUpdate(
      id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedInquiry) {
      return res.status(404).json({
        success: false,
        message: "Inquiry not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Inquiry updated successfully",
      data: updatedInquiry,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// DELETE INQUIRY
export const deleteInquiry = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid inquiry id",
      });
    }

    const deletedInquiry = await Inquiry.findByIdAndDelete(id);

    if (!deletedInquiry) {
      return res.status(404).json({
        success: false,
        message: "Inquiry not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Inquiry deleted successfully",
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getInquiryListByUserId = async (req, res) => {
  try {
    const { userid } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(userid)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user id",
      });
    }

    // Find inquiries by userid
    const inquiries = await Inquiry.find({ userid })
      .populate({
        path: "travelTripId",
        populate: {
          path: "cityIds",
          model: "City",
          select: "city_name",
        },
      })
      .populate("userid")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      total: inquiries.length,
      data: inquiries,
    });
  } catch (error) {
    console.log("Get Inquiry By UserId Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};