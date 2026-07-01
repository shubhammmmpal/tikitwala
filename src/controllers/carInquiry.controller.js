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
    const {
      page = 1,
      limit = 10,
      search = "",
      startDate,
      endDate,
    } = req.query;

    const query = {};

    // Date Filter
    if (startDate || endDate) {
      query.createdAt = {};

      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }

      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    let inquiries = await CarInquiry.find(query)
      .populate("carRentId")
      .populate("userid")
      .sort({ createdAt: -1 });

    // Search Filter (after populate)
    if (search) {
      const keyword = search.toLowerCase();

      inquiries = inquiries.filter((item) => {
        return (
          item?.userid?.name?.toLowerCase().includes(keyword) ||
          item?.userid?.email?.toLowerCase().includes(keyword) ||
          item?.userid?.phone?.toLowerCase().includes(keyword) ||
          item?.carRentId?.carName?.toLowerCase().includes(keyword)
        );
      });
    }

    const totalRecords = inquiries.length;

    const paginatedData = inquiries.slice(
      (page - 1) * limit,
      page * limit
    );

    return res.status(200).json({
      success: true,
      currentPage: Number(page),
      totalPages: Math.ceil(totalRecords / limit),
      totalRecords,
      count: paginatedData.length,
      data: paginatedData,
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