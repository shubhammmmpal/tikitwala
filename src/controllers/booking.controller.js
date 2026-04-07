import Booking from "../models/Booking.model.js";
import BusTrip from "../models/BusTrip.model.js";
import mongoose from "mongoose";

// ====================== BOOK BUS TRIP ======================
// ================= HELPER =================
const getAdjacentSeat = (seatNo) => {
  const prefix = seatNo.slice(0, -1);
  const lastDigit = parseInt(seatNo.slice(-1));

  if (isNaN(lastDigit)) return null;

  return lastDigit % 2 === 1
    ? prefix + (lastDigit + 1)
    : prefix + (lastDigit - 1);
};

// ================= BOOK BUS TRIP =================
export const bookBusTrip = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      busTripId,
      passengers,
      contactEmail,
      contactPhone,
      selectedSeats
    } = req.body;

    const userId = req.user?.id || null;

    // ================= VALIDATIONS =================
    if (!busTripId) throw new Error("BusTrip ID is required");

    if (!selectedSeats || selectedSeats.length === 0) {
      throw new Error("Please select at least one seat");
    }

    if (!passengers || passengers.length !== selectedSeats.length) {
      throw new Error("Passengers and seats count mismatch");
    }

    // ================= FETCH TRIP =================
    const busTrip = await BusTrip.findById(busTripId).session(session);

    if (!busTrip) throw new Error("Bus trip not found");

    if (busTrip.status !== "active") {
      throw new Error("Trip is not available for booking");
    }

    let totalAmount = 0;
    const bookedSeats = [];
    const selectedSeatsSet = new Set(selectedSeats);

    // ================= PROCESS SEATS =================
    for (let i = 0; i < selectedSeats.length; i++) {
      const seatNo = selectedSeats[i];
      const passenger = passengers[i];

      const seat = busTrip.seats.find(s => s.seatNo === seatNo);

      if (!seat) throw new Error(`Seat ${seatNo} not found`);

    //   if (seat.status !== "available") {
    //     throw new Error(`Seat ${seatNo} is already booked/blocked`);
    //   }
    if (
  seat.status !== "available" &&
  !selectedSeatsSet.has(seatNo) // 🔥 allow if it's in same booking
) {
  throw new Error(`Seat ${seatNo} is already booked/blocked`);
}

      // ================= GENDER LOGIC =================
      if (seat.seatType === "SLEEPER") {
        const adjacentSeatNo = getAdjacentSeat(seatNo);
        const adjacentSeat = busTrip.seats.find(s => s.seatNo === adjacentSeatNo);

        if (adjacentSeat) {

          // ❌ BOOKED CASE (different user, opposite gender)
          if (
            adjacentSeat.status === "booked" &&
            adjacentSeat.genderBooked &&
            adjacentSeat.genderBooked !== passenger.gender &&
            String(adjacentSeat.bookedBy) !== String(userId)
          ) {
            throw new Error(
              `Adjacent seat ${adjacentSeatNo} is booked by ${adjacentSeat.genderBooked}`
            );
          }

          // ❌ BLOCKED CASE (different user, opposite gender)
          if (
  adjacentSeat.status === "blocked" &&
  adjacentSeat.seatFor &&
  adjacentSeat.seatFor !== "None" &&
  adjacentSeat.seatFor !== passenger.gender &&
  String(adjacentSeat.bookedBy) !== String(userId)
) {
  throw new Error(
    `Adjacent seat ${adjacentSeatNo} is reserved for ${adjacentSeat.seatFor}`
  );
}
        }
      }

      // ❌ STRICT RULE
if (seat.status === "booked") {
  throw new Error(`Seat ${seatNo} is already booked`);
}

// ❌ BLOCKED (only other user ke liye block)
if (
  seat.status === "blocked" &&
  String(seat.bookedBy) !== String(userId)
) {
  throw new Error(`Seat ${seatNo} is reserved`);
}

      // ================= BOOK CURRENT SEAT =================
      seat.status = "booked";
      seat.bookedBy = userId;
      seat.genderBooked = passenger.gender;
      seat.seatFor = "None";
      totalAmount += seat.seatPrice;
      bookedSeats.push(seat);

      // ================= AUTO BLOCK ADJACENT =================
      if (seat.seatType === "SLEEPER") {
        const adjacentSeatNo = getAdjacentSeat(seatNo);
        const adjacentSeat = busTrip.seats.find(s => s.seatNo === adjacentSeatNo);

if (
  adjacentSeat &&
  adjacentSeat.status === "available" &&
  !selectedSeatsSet.has(adjacentSeatNo) // 🔥 don't block if user already selected it
) {
  adjacentSeat.status = "blocked";
  adjacentSeat.seatFor = passenger.gender;
  adjacentSeat.bookedBy = userId;
}
      }
    }

    // ================= PRICE CALC =================
    const gst = Math.round(totalAmount * 0.05);
    const platformFee = 100;
    const finalAmount = totalAmount + gst + platformFee;

    // ================= CREATE BOOKING =================
    const newBooking = new Booking({
      bookingId: "", // auto generate in schema
      user: userId,
      busTrip: busTripId,

      bus: {
        busNo: busTrip.bus?.busNo || "N/A",
        busType: busTrip.bus?.busType || "N/A",
      },

      startPoint: busTrip.startPoint,
      endPoint: busTrip.endPoint,
      departureDateTime: busTrip.departureDateTime,
      arrivalDateTime: busTrip.arrivalDateTime,
      departureDate: busTrip.departureDate,
      departureTime: busTrip.departureTime,
      arrivalDate: busTrip.arrivalDate,
      arrivalTime: busTrip.arrivalTime,
      travelDuration: busTrip.travelDuration,

      passengers: passengers.map((p, index) => ({
        name: p.name,
        gender: p.gender,
        age: p.age,
        seatNo: selectedSeats[index],
        deck: bookedSeats[index].deck,
      })),

      totalPassengers: passengers.length,
      totalSeatsBooked: passengers.length,

      contactEmail,
      contactPhone,

      fareBreakup: {
        baseFare: totalAmount,
        gst,
        platformFee,
        otherCharges: 0,
        totalAmount: finalAmount
      },

      paymentStatus: "pending",
      status: "confirmed"
    });

    await newBooking.save({ session });
    await busTrip.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      success: true,
      message: "Booking successful",
      data: newBooking
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    return res.status(400).json({
      success: false,
      message: error.message || "Booking failed"
    });
  }
};


export const getAllBusBookingsList = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, paymentStatus } = req.query;

    const filter = {};

    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;

    const bookings = await Booking.find(filter)
      .populate("user", "name email")
      .populate("busTrip")
      .sort({ createdAt: -1 }) // latest first
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Booking.countDocuments(filter);

    res.status(200).json({
      success: true,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: bookings
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


export const getBusBookingById = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findById(id)
      .populate("user", "name email")
      .populate("busTrip");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }

    res.status(200).json({
      success: true,
      data: booking
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getBusBookingByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const bookings = await Booking.find({ user: userId })
    //   .populate("busTrip")
    //   .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      total: bookings.length,
      data: bookings
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};



export const changeBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }

    // ✅ If cancelling → free seats
    if (status === "cancelled") {
      const busTrip = await BusTrip.findById(booking.busTrip);

      if (busTrip) {
        booking.passengers.forEach(passenger => {
          const seat = busTrip.seats.find(
            s => s.seatNo === passenger.seatNo
          );

          if (seat) {
            seat.status = "available";
            seat.seatFor = "None";
            seat.genderBooked = null;
            seat.bookedBy = null;
          }
        });

        await busTrip.save();
      }
    }

    booking.status = status;
    booking.updatedAt = new Date();

    await booking.save();

    res.status(200).json({
      success: true,
      message: "Booking status updated",
      data: booking
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }

    await Booking.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Booking deleted successfully"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};