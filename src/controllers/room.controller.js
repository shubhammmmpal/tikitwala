import Room from '../models/room.model.js';
// import RoomAvailability from '../models/roomAvailability.model.js';
import Hotel from '../models/hotel.model.js';

// ====================== PUBLIC APIS ======================

export const getHotelRooms = async (req, res) => {
  try {
    const { hotelId } = req.params;
    
    const rooms = await Room.find({ 
      hotel: hotelId,
      status: 'ACTIVE'
    }).select('name roomType basePricePerNight capacity maxOccupancy amenities images');

    res.status(200).json({
      success: true,
      count: rooms.length,
      rooms
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const checkRoomAvailability = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { checkIn, checkOut } = req.query;

    if (!checkIn || !checkOut) {
      return res.status(400).json({ 
        success: false, 
        message: 'checkIn and checkOut dates are required (YYYY-MM-DD)' 
      });
    }

    const startDate = new Date(checkIn);
    const endDate = new Date(checkOut);

    if (startDate >= endDate) {
      return res.status(400).json({ success: false, message: 'Check-out must be after check-in' });
    }

    // Get room details
    const room = await Room.findById(roomId).populate('hotel', 'name');
    if (!room || room.status !== 'ACTIVE') {
      return res.status(404).json({ success: false, message: 'Room not found or inactive' });
    }

    // Check availability for each date in range
    const dates = [];
    let currentDate = new Date(startDate);

    while (currentDate < endDate) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const availabilityRecords = await RoomAvailability.find({
      room: roomId,
      date: { $in: dates }
    });

    // Calculate real-time available rooms and price
    const availability = availabilityRecords.map(record => ({
      date: record.date.toISOString().split('T')[0],
      available: Math.max(0, record.availableCount - record.heldCount),
      pricePerNight: record.priceOverride || room.basePricePerNight,
      isAvailable: (record.availableCount - record.heldCount) > 0
    }));

    const allAvailable = availability.every(a => a.isAvailable);
    const totalNights = dates.length;

    res.status(200).json({
      success: true,
      room: {
        id: room._id,
        name: room.name,
        roomType: room.roomType,
        basePricePerNight: room.basePricePerNight
      },
      checkIn,
      checkOut,
      totalNights,
      availability,
      isFullyAvailable: allAvailable,
      message: allAvailable ? 'Room is available for all dates' : 'Room is not available for all selected dates'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ====================== ADMIN ONLY APIS ======================

export const createRoom = async (req, res) => {
  try {
    const { hotel } = req.body;

    // Verify hotel exists
    const hotelExists = await Hotel.findById(hotel);
    if (!hotelExists) {
      return res.status(404).json({ success: false, message: 'Hotel not found' });
    }

    const room = await Room.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Room created successfully',
      room
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateRoom = async (req, res) => {
  try {
    const room = await Room.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Room updated successfully',
      room
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    room.status = 'INACTIVE'; // Soft delete
    await room.save();

    res.status(200).json({ success: true, message: 'Room deactivated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};