import mongoose from "mongoose";

import Review from "../models/review.model.js";

import Hotel from "../models/hotel.model.js";
import Bus from "../models/Bus.model.js";

import BookingHotel from "../models/BookingHotel.model.js";
import Booking from "../models/Booking.model.js";
// import TrainBooking from "../models/trainBooking.model.js";
// import FlightBooking from "../models/flightBooking.model.js";
// import TripBooking from "../models/tripBooking.model.js";
import BusTrip from "../models/BusTrip.model.js";

import {updateEntityRatings} from "../utils/updateEntityRatings.js";

// ======================================================
// ENTITY MODELS
// ======================================================

const ENTITY_MODELS = {
  Hotel,
  Bus,
  BusTrip,
};

// ======================================================
// BOOKING MODELS
// ======================================================

const BOOKING_MODELS = {
  BookingHotel,
  Booking,
  // TrainBooking,
  // FlightBooking,
  // TripBooking,
};

// ======================================================
// CREATE REVIEW
// ======================================================

export const createReview = async (req, res) => {

  try {

    // const userId = req.user.id;

    const {
      entityId,
      entityType,
      userId,
      rating,
      comment,
      title,
      images,
    } = req.body;

    // =========================================
    // VALIDATE ENTITY TYPE
    // =========================================

    const EntityModel =
      ENTITY_MODELS[entityType];

    if (!EntityModel) {
      return res.status(400).json({
        success: false,
        message: "Invalid entity type",
      });
    }

    // =========================================
    // CHECK ENTITY EXISTS
    // =========================================

    const entity =
      await EntityModel.findById(entityId);

    if (!entity) {
      return res.status(404).json({
        success: false,
        message: `${entityType} not found`,
      });
    }

    // =========================================
    // FIND VALID BOOKING
    // =========================================

    let booking = null;

    // BUS REVIEW
    if (entityType === "Bus") {

      booking = await Booking.findOne({
        user: userId,
        bus: entityId,
        status: "completed",
      });

    }

    // BUS TRIP REVIEW
    if (entityType === "BusTrip") {

      booking = await Booking.findOne({
        user: userId,
        busTrip: entityId,
        status: "completed",
      });

    }

    // HOTEL REVIEW
    if (entityType === "Hotel") {

      booking =
        await BookingHotel.findOne({
          user: userId,
          hotel: entityId,
          status: "completed",
        });

    }

    // =========================================
    // BOOKING VALIDATION
    // =========================================

    if (!booking) {

      return res.status(400).json({
        success: false,
        message:
          "No completed booking found for review",
      });

    }

    // =========================================
    // DUPLICATE REVIEW CHECK
    // =========================================

    const alreadyReviewed =
      await Review.findOne({
        user: userId,
        entityId,
      });

    if (alreadyReviewed) {

      return res.status(400).json({
        success: false,
        message:
          "You already reviewed this service",
      });

    }

    // =========================================
    // CREATE REVIEW
    // =========================================

    const review = await Review.create({

      user: userId,

      entityId,

      entityType,

      bookingId: booking._id,

      bookingModel:
        booking.constructor.modelName,

      rating,

      comment,

      title,

      images,

      isVerified: true,

    });

    // =========================================
    // UPDATE RATINGS
    // =========================================

    await updateEntityRatings(
      entityType,
      entityId
    );

    // =========================================
    // UPDATE PARENT BUS
    // =========================================

    if (entityType === "BusTrip") {

      const trip =
        await BusTrip.findById(entityId);

      if (trip) {

        await updateEntityRatings(
          "Bus",
          trip.bus
        );

      }

    }

    return res.status(201).json({
      success: true,
      message:
        "Review submitted successfully",
      review,
    });

  } catch (error) {

    console.log(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }

};

export const updateReview = async (req, res) => {
  try {
    const userId = req.user.id;

    const { reviewId } = req.params;

    const { rating, comment, title, images } = req.body;

    // =========================================
    // FIND REVIEW
    // =========================================

    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    // =========================================
    // VERIFY OWNER
    // =========================================

    if (review.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    // =========================================
    // UPDATE REVIEW
    // =========================================

    if (rating) review.rating = rating;
    if (comment) review.comment = comment;
    if (title) review.title = title;
    if (images) review.images = images;

    review.editedAt = new Date();

    await review.save();

    // =========================================
    // UPDATE ENTITY RATINGS
    // =========================================

    await updateEntityRatings(review.entityType, review.entityId);

    return res.status(200).json({
      success: true,
      message: "Review updated successfully",
      review,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export const deleteReview = async (req, res) => {
  try {
    const userId = req.user.id;

    const { reviewId } = req.params;

    // =========================================
    // FIND REVIEW
    // =========================================

    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    // =========================================
    // VERIFY OWNER
    // =========================================

    if (review.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    // =========================================
    // DELETE REVIEW
    // =========================================

    const entityType = review.entityType;
    const entityId = review.entityId;
    const bookingId = review.bookingId;
    const bookingModel = review.bookingModel;

    await review.deleteOne();

    // =========================================
    // MARK BOOKING REVIEW FALSE
    // =========================================

    const BookingModel = BOOKING_MODELS[bookingModel];

    if (BookingModel) {
      await BookingModel.findByIdAndUpdate(bookingId, {
        isReviewed: false,
      });
    }

    // =========================================
    // UPDATE RATINGS
    // =========================================

    await updateEntityRatings(entityType, entityId);

    return res.status(200).json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export const getReviewsByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const reviews = await Review.find({
      user: userId,
      isApproved: true,
    })
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      total: reviews.length,
      reviews,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export const getReviewsByEntity = async (req, res) => {
  try {
    const { entityId } = req.params;

    const reviews = await Review.find({
      entityId,
      isApproved: true,
    })
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      total: reviews.length,
      reviews,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export const getReviewByBookingId = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const review = await Review.findOne({
      bookingId,
    }).populate("user", "name email");

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    return res.status(200).json({
      success: true,
      review,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
