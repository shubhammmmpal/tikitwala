// controllers/carInquiryController.js

import CarInquiry from "../models/carInquiry.model.js";


// =====================================
// Create Car Inquiry
// =====================================
export const createCarInquiry = async (req, res) => {
  try {

    const {
      carRentId,
      userid,
      datefrom,
      dateto,
    } = req.body;

    const inquiry = await CarInquiry.create({
      carRentId,
      userid,
      datefrom,
      dateto,
    });

    return res.status(201).json({
      success: true,
      message: "Car inquiry created successfully",
      data: inquiry,
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};


// =====================================
// Get All Car Inquiries
// =====================================
export const getAllCarInquiry = async (req, res) => {
  try {

    const inquiries = await CarInquiry.find()
      .populate("carRentId")
      .populate("userid")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: inquiries.length,
      data: inquiries,
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};


// =====================================
// Get Car Inquiry By ID
// =====================================
export const getCarInquiryByID = async (req, res) => {
  try {

    const inquiry = await CarInquiry.findById(req.params.id)
      .populate("carRentId")
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

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};


// =====================================
// Delete Car Inquiry
// =====================================
export const deleteCarInquiry = async (req, res) => {
  try {

    const inquiry = await CarInquiry.findByIdAndDelete(
      req.params.id
    );

    if (!inquiry) {
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

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};


// =====================================
// Get Car Inquiry By User ID
// =====================================
export const getCarInquiryByUserId = async (req, res) => {
  try {

    const inquiries = await CarInquiry.find({
      userid: req.params.userId
    })
      .populate("carRentId")
      .populate("userid")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: inquiries.length,
      data: inquiries,
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};