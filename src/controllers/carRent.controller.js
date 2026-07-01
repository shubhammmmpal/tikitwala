// controllers/carRentController.js

import CarRent from "../models/carRent.model.js";


// ============================
// Create Car
// ============================
export const createCarRent = async (req, res) => {
  try {

    // Uploaded images
    const images = req.files
      ? req.files.map((file) => file.path)
      : [];

    const newCar = new CarRent({
      carModel: req.body.carModel,
      transmission: req.body.transmission,
      discription: req.body.discription,
      seatsCount: req.body.seatsCount,
      fuelType: req.body.fuelType,
      pricePerDay: req.body.pricePerDay,
      availability: req.body.availability,
      location: req.body.location,

      features: req.body.features
        ? JSON.parse(req.body.features)
        : [],

      images,
    });

    await newCar.save();

    return res.status(201).json({
      success: true,
      message: "Car created successfully",
      data: newCar,
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};


// ============================
// Get All Cars
export const getAllCarList = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      status,
      availability,
      startDate,
      endDate,
    } = req.query;

    const filter = {};

    // Search
    if (search) {
      filter.$or = [
        { carModel: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
        { fuelType: { $regex: search, $options: "i" } },
        { transmission: { $regex: search, $options: "i" } },
      ];
    }

    // Status Filter
    if (status) {
      filter.status = status;
    }

    // Availability Filter
    if (availability !== undefined && availability !== "") {
      filter.availability = availability === "true";
    }

    // Created Date Filter
    if (startDate || endDate) {
      filter.createdAt = {};

      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }

      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Include the full end date
        filter.createdAt.$lte = end;
      }
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [cars, total] = await Promise.all([
      CarRent.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      CarRent.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: cars,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ============================
// Get Car By Id
// ============================
export const getCarById = async (req, res) => {
  try {

    const car = await CarRent.findById(req.params.id);

    if (!car) {
      return res.status(404).json({
        success: false,
        message: "Car not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: car,
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};


// ============================
// Update Car
// ============================
export const updateCar = async (req, res) => {
  try {

    const car = await CarRent.findById(req.params.id);

    if (!car) {
      return res.status(404).json({
        success: false,
        message: "Car not found",
      });
    }

    // Keep old images if no new image uploaded
    let images = car.images;

    if (req.files && req.files.length > 0) {
      images = req.files.map((file) => file.path);
    }

    const updatedCar = await CarRent.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,

        features: req.body.features
          ? JSON.parse(req.body.features)
          : [],

        images,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    return res.status(200).json({
      success: true,
      message: "Car updated successfully",
      data: updatedCar,
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};


// ============================
// Delete Car
// ============================
export const deleteCar = async (req, res) => {
  try {

    const deletedCar = await CarRent.findByIdAndDelete(
      req.params.id
    );

    if (!deletedCar) {
      return res.status(404).json({
        success: false,
        message: "Car not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Car deleted successfully",
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};