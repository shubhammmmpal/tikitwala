import Passenger from "../models/passenger.model.js";

// =======================
// Create Passenger
// =======================
export const createPassenger = async (req, res) => {
  try {
    const passenger = await Passenger.create({
      ...req.body,
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      message: "Passenger created successfully",
      data: passenger
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// =======================
// Get All Passengers
// =======================
export const getPassengers = async (req, res) => {
  try {
    const {
      search = "",
      gender,
      page = 1,
      limit = 10,
    } = req.query;

    const filter = {};

    // User can only see their own passengers
    if (req.user.role !== "Admin") {
      filter.createdBy = req.user.id;
    }

    // Search on name, phone, email
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        // { phone: { $regex: search, $options: "i" } },
        // { email: { $regex: search, $options: "i" } }
      ];
    }

    // Gender filter
    if (gender) {
      filter.gender = gender;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const totalRecords = await Passenger.countDocuments(filter);

    const passengers = await Passenger.find(filter)
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      message: "Passengers fetched successfully",
      data: passengers,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(totalRecords / limit),
        totalRecords,
        perPage: Number(limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =======================
// Get Passenger By Id
// =======================
export const getPassengerById = async (req, res) => {
  try {
    let filter = { _id: req.params.id };

    if (req.user.role !== "Admin") {
      filter.createdBy = req.user.id;
    }

    const passenger = await Passenger.findOne(filter);

    if (!passenger) {
      return res.status(404).json({
        success: false,
        message: "Passenger not found"
      });
    }

    res.status(200).json({
      success: true,
      data: passenger
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// =======================
// Update Passenger
// =======================
export const updatePassenger = async (req, res) => {
  try {
    let filter = { _id: req.params.id };

    if (req.user.role !== "Admin") {
      filter.createdBy = req.user.id;
    }

    const passenger = await Passenger.findOneAndUpdate(
      filter,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!passenger) {
      return res.status(404).json({
        success: false,
        message: "Passenger not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Passenger updated successfully",
      data: passenger
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// =======================
// Delete Passenger
// =======================
export const deletePassenger = async (req, res) => {
  try {
    let filter = { _id: req.params.id };

    if (req.user.role !== "Admin") {
      filter.createdBy = req.user.id;
    }

    const passenger = await Passenger.findOneAndDelete(filter);

    if (!passenger) {
      return res.status(404).json({
        success: false,
        message: "Passenger not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Passenger deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};