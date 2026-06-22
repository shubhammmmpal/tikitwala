import BookingHotel from '../models/BookingHotel.model.js';
import Room from '../models/room.model.js';
import RoomAvailability from '../models/RoomAvailability.model.js';
import Hotel from '../models/hotel.model.js';
// import Payment from '../models/payment.model.js';
import mongoose from 'mongoose';

// ====================== HELPER FUNCTION ======================
const calculateTotalPrice = (rooms, nights) => {
  return rooms.reduce((total, item) => total + (item.pricePerNight * nights * item.quantity), 0);
};

// ====================== PUBLIC / AUTHENTICATED APIS ======================

export const createHotelBooking = async (req, res) => {
  // try {
  //   const { hotel, rooms, checkInDate, checkOutDate, guestDetails, source = 'USER' } = req.body;
  //   const userId = req.user?._id;
  //   console.log(req.user)

  //   if (!hotel || !rooms || !checkInDate || !checkOutDate) {
  //     return res.status(400).json({ success: false, message: 'Missing required fields' });
  //   }

  //   const checkIn = new Date(checkInDate);
  //   const checkOut = new Date(checkOutDate);
  //   const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));

  //   if (nights <= 0) {
  //     return res.status(400).json({ success: false, message: 'Invalid date range' });
  //   }

  //   // Verify hotel exists
  //   const hotelData = await Hotel.findById(hotel);
  //   if (!hotelData || hotelData.status !== 'ACTIVE') {
  //     return res.status(404).json({ success: false, message: 'Hotel not available' });
  //   }

  //   // Check availability and calculate price
  //   let totalPrice = 0;
  //   const bookingRooms = [];

  //   for (const roomItem of rooms) {
  //     const room = await Room.findById(roomItem.room);
  //     if (!room || room.status !== 'ACTIVE') {
  //       return res.status(400).json({ success: false, message: `Room ${roomItem.room} not available` });
  //     }

  //     // Check availability for all dates
  //     const dates = [];
  //     let current = new Date(checkIn);
  //     while (current < checkOut) {
  //       dates.push(new Date(current));
  //       current.setDate(current.getDate() + 1);
  //     }

  //     const availabilities = await RoomAvailability.find({
  //       room: roomItem.room,
  //       date: { $in: dates }
  //     });

  //     const isAvailable = availabilities.every(a => (a.availableCount - a.heldCount) >= roomItem.quantity);

  //     if (!isAvailable) {
  //       return res.status(400).json({ success: false, message: `Room ${room.name} not available for selected dates` });
  //     }

  //     const pricePerNight = roomItem.pricePerNight || room.basePricePerNight;
  //     totalPrice += pricePerNight * nights * roomItem.quantity;

  //     bookingRooms.push({
  //       room: roomItem.room,
  //       quantity: roomItem.quantity,
  //       pricePerNight
  //     });
  //   }

  //   // Create Booking
  //   const bookingHotel = await BookingHotel.create({
  //     bookedById: userId,
  //     source: source === 'AGENT' ? 'AGENT' : 'USER',
  //     customerId: req.body.customerId || userId,
  //     hotel,
  //     rooms: bookingRooms,
  //     checkInDate: checkIn,
  //     checkOutDate: checkOut,
  //     guestDetails,
  //     totalPrice,
  //     status: 'PENDING',
  //     paymentStatus: 'PENDING'
  //   });

  //   // TODO: Later - Hold inventory (heldCount++) using transaction

  //   res.status(201).json({
  //     success: true,
  //     message: 'Booking created successfully',
  //     bookingHotel
  //   });
  // } catch (error) {
  //   res.status(500).json({ success: false, message: error.message });
  // }

   const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      hotelId,
      rooms, // [{ roomId, quantity }]
      checkInDate,
      checkOutDate,
      guestDetails,
      source,
      customerId
    } = req.body;

    const userId = req.user._id;

    // 🔴 Basic validation
    if (new Date(checkInDate) >= new Date(checkOutDate)) {
      throw new Error("Invalid date range");
    }

    if (!rooms || rooms.length === 0) {
      throw new Error("No rooms selected");
    }

    // 🧮 Nights
    const nights =
      (new Date(checkOutDate) - new Date(checkInDate)) /
      (1000 * 60 * 60 * 24);

    let totalPrice = 0;
    let roomData = [];

    // 🔥 Loop each room type
    for (const item of rooms) {
      const room = await Room.findById(item.roomId).session(session);

      if (!room) throw new Error("Room not found");

      // 👉 Availability check
      const bookings = await BookingHotel.find({
        "rooms.room": item.roomId,
        status: { $ne: "CANCELLED" },
        checkInDate: { $lt: checkOutDate },
        checkOutDate: { $gt: checkInDate }
      }).session(session);

      let bookedQty = 0;

      bookings.forEach(b => {
        const matchedRoom = b.rooms.find(
          r => r.room.toString() === item.roomId
        );
        if (matchedRoom) bookedQty += matchedRoom.quantity;
      });

      const available = room.totalInventory - bookedQty;

      if (available < item.quantity) {
        throw new Error(`Not enough availability for ${room.name}`);
      }

      // 💰 Price calculation
      const price =
        room.discountPricePerNight || room.basePricePerNight;

      totalPrice += price * nights * item.quantity;

      roomData.push({
        room: item.roomId,
        quantity: item.quantity,
        pricePerNight: price
      });
    }

    // ➕ Taxes / fees (optional logic)
    const tax = totalPrice * 0.12; // 12% example
    const serviceFee = 100;

    const finalAmount = totalPrice + tax + serviceFee;

    // 💾 Create booking
    const booking = await BookingHotel.create([{
      bookedById: userId,
      source,
      customerId: source === "AGENT" ? customerId : null,
      hotel: hotelId,
      rooms: roomData,
      checkInDate,
      checkOutDate,
      guestDetails,
      otherCharges: {
        tax,
        serviceFee,
        convinenceFee: 0
      },
      totalPrice: finalAmount
    }], { session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      message: "Hotel booked successfully",
      booking: booking[0]
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    res.status(400).json({
      message: error.message
    });
  }
};

export const getMyHotelBookings = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = { bookedById: req.user.id };

    if (status) query.status = status;

    const bookings = await BookingHotel.find(query)
      .populate('hotel', 'name address')
      .populate('rooms.room', 'name roomType')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await BookingHotel.countDocuments(query);

    res.status(200).json({
      success: true,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      bookings
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getHotelBookingById = async (req, res) => {
  try {
    const booking = await BookingHotel.findById(req.params.id)
      .populate('hotel', 'name address images')
      .populate('rooms.room', 'name roomType basePricePerNight');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Allow only owner or admin
    if (booking.bookedById.toString() !== req.user.id.toString() && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.status(200).json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const cancelHotelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const booking = await BookingHotel.findById(id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.bookedById.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (booking.status === 'CANCELLED') {
      return res.status(400).json({ success: false, message: 'Booking already cancelled' });
    }

    booking.status = 'CANCELLED';
    booking.cancellationReason = reason || 'Cancelled by user';
    await booking.save();

    // TODO: Release inventory & process refund (later)

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      booking
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ====================== AGENT ONLY ======================

export const createAgentHotelBooking = async (req, res) => {
  // Same logic as createBooking but with extra validation for agents
  console.log(req)
//   req.body.source = 'AGENT';
  return createHotelBooking(req, res);
};


// ====================== ADMIN ONLY ======================

export const getAllHotelBookings = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, paymentStatus, source } = req.query;

    const query = {};
    if (status) query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (source) query.source = source;

    const bookings = await BookingHotel.find(query)
      .populate('hotel', 'name address.city')
      .populate('bookedById', 'firstName lastName email phone role')
      .populate('customerId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await BookingHotel.countDocuments(query);

    res.status(200).json({
      success: true,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      bookings
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateHotelBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const booking = await BookingHotel.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate('hotel', 'name');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    res.status(200).json({
      success: true,
      message: `Booking status updated to ${status}`,
      booking
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markCheckIn = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await BookingHotel.findByIdAndUpdate(
      id,
      { 
        status: 'CHECKED_IN',
        checkedInAt: new Date()
      },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Guest checked in successfully',
      booking
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};