import BusTrip from "../models/BusTrip.model.js";
import Bus from "../models/Bus.model.js";
import fs from "fs";
import path from "path";
// @desc    Get bus list based on startPoint, endPoint and date
// @route   GET /api/buses
// @access  Public

// @desc    Search buses based on startPoint, endPoint and date
// @route   GET /api/buses/search
// @access  Public

// @desc    Search buses based on startPoint, endPoint and date
// @route   GET /api/buses/search
// @access  Public
export const searchBuses = async (req, res) => {
  try {
    const { startPoint, endPoint, date } = req.query;

    // ✅ Validation
    if (!startPoint || !endPoint || !date) {
      return res.status(400).json({
        success: false,
        message: "startPoint, endPoint and date are required",
      });
    }

    // ✅ Query (Exact Match on departureDate)
    const buses = await BusTrip.find({
      startPoint: { $regex: new RegExp(`^${startPoint}$`, "i") }, // case-insensitive
      endPoint: { $regex: new RegExp(`^${endPoint}$`, "i") },
      departureDate: date,
      status: "active",
    }).populate("bus"); // optional

    return res.status(200).json({
      success: true,
      count: buses.length,
      data: buses,
    });
  } catch (error) {
    console.error("Search Bus Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const createBus = async (req, res) => {
  try {
    const busData = req.body;

    // Assuming auth middleware adds user in req.user
    busData.createdBy = req.user.id;

    // Store uploaded image paths
    if (req.files && req.files.length > 0) {
      busData.images = req.files.map((file) => {
        return `/uploads/buses/${file.filename}`;
      });
    }

    const newBus = new Bus(busData);
    await newBus.save();

    res.status(201).json({
      success: true,
      message: "Bus created successfully",
      data: newBus,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Error creating bus",
    });
  }
};

// Get All Buses (with pagination and filters)
export const getBusList = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    console.log(req.user.id, req.user.role);

    const { page = 1, limit = 10, search = "", status, busType,createdBy,startDate,endDate } = req.query;

    const countQuery = {};

    // Generic agent can see only own buses
    if (userRole !== "admin") {
      countQuery.createdBy = userId;
    }

    const [totalBusCount, activeBusCount, inactiveBusCount] = await Promise.all(
      [
        Bus.countDocuments(countQuery),
        Bus.countDocuments({
          ...countQuery,
          status: "ACTIVE",
        }),
        Bus.countDocuments({
          ...countQuery,
          status: "INACTIVE",
        }),
      ],
    );

    let query = {};

if (userRole !== "admin") {
  query.createdBy = userId;
}

if (userRole === "admin" && createdBy) {
  query.createdBy = createdBy;
}

if (search?.trim()) {
  query.$or = [
    {
      busName: {
        $regex: search.trim(),
        $options: "i",
      },
    },
    {
      busNo: {
        $regex: search.trim(),
        $options: "i",
      },
    },
  ];
}

if (status) {
  query.status = status;
}

if (busType) {
  query.busType = busType;
}

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

    const buses = await Bus.find(query)
      .populate("travelAgency")
      .populate("createdBy", "name email role")
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    const total = await Bus.countDocuments(query);

    const now = new Date();

const busesWithTripInfo = await Promise.all(
  buses.map(async (bus) => {
    let trip = await BusTrip.findOne({
      bus: bus._id,
      departureDateTime: { $gte: now },
    })
      .populate("startPoint", "city_name")
      .populate("endPoint", "city_name")
      .sort({ departureDateTime: 1 });

    if (!trip) {
      trip = await BusTrip.findOne({
        bus: bus._id,
      })
        .populate("startPoint", "city_name")
        .populate("endPoint", "city_name")
        .sort({ departureDateTime: -1 });
    }

    // Seat Counts
    const totalSeats = trip?.seats?.length || 0;

    const bookedSeats =
      trip?.seats?.filter((seat) => seat.status === "booked").length || 0;

    const availableSeats =
      trip?.seats?.filter((seat) => seat.status === "available").length || 0;

    const blockedSeats =
      trip?.seats?.filter((seat) => seat.status === "blocked").length || 0;

    return {
      ...bus.toObject(),

      seatInfo: {
        totalSeats,
        bookedSeats,
        availableSeats,
        blockedSeats,
      },

      routeInfo: trip
        ? {
            startPoint: trip.startPoint,
            endPoint: trip.endPoint,
            departureDateTime: trip.departureDateTime,
            tripId: trip._id,
          }
        : null,
    };
  })
);

    return res.status(200).json({
      success: true,
      counts: {
        total: totalBusCount,
        active: activeBusCount,
        inactive: inactiveBusCount,
      },
      total,
      currentPage: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      data: busesWithTripInfo,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Error fetching buses",
    });
  }
};

// Get Bus by ID
export const getBusById = async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id).populate(
      "travelAgency",
      "name email contactNumber address",
    );

    if (!bus) {
      return res.status(404).json({
        success: false,
        message: "Bus not found",
      });
    }

    res.status(200).json({
      success: true,
      data: bus,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching bus details",
    });
  }
};

// Update Bus
export const updateBus = async (req, res) => {
  try {
    const { id } = req.params;

    const bus = await Bus.findById(id);

    if (!bus) {
      return res.status(404).json({
        success: false,
        message: "Bus not found",
      });
    }

    // Update fields from form-data
    Object.keys(req.body).forEach((key) => {
      bus[key] = req.body[key];
    });

    // Update uploaded images
    if (req.files && req.files.length > 0) {
      bus.images = req.files.map((file) => `/uploads/buses/${file.filename}`);
    }

    await bus.save();

    return res.status(200).json({
      success: true,
      message: "Bus updated successfully",
      data: bus,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete Bus
export const deleteBus = async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id);

    if (!bus) {
      return res.status(404).json({
        success: false,
        message: "Bus not found",
      });
    }

    // Delete images from uploads folder
    if (bus.images && bus.images.length > 0) {
      bus.images.forEach((imagePath) => {
        const fullPath = path.join(process.cwd(), imagePath);

        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      });
    }

    // Delete bus record
    await Bus.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Bus and associated images deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Error deleting bus",
    });
  }
};

// Change Bus Status (Active / Maintenance / Inactive)
export const changeBusStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["ACTIVE", "MAINTENANCE", "INACTIVE"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const bus = await Bus.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true },
    );

    if (!bus) {
      return res.status(404).json({
        success: false,
        message: "Bus not found",
      });
    }

    res.status(200).json({
      success: true,
      message: `Bus status changed to ${status}`,
      data: bus,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error changing bus status",
    });
  }
};

// ==================== GENERATE SEAT STRUCTURE ====================
// export const generateBusSeats = async (req, res) => {
//   try {
//     const { busId } = req.params;
//     const { seatType, totalRows, lastRowSeats, lowerDeckRows, upperDeckRows } = req.body;

//     const bus = await Bus.findById(busId);
//     if (!bus) {
//       return res.status(404).json({ success: false, message: "Bus not found" });
//     }

//     let seats = [];

//     if (["Seater", "AC Seater", "Non-AC Seater"].includes(bus.busType)) {
//       // ==================== SEATER BUS ====================
//       if (!seatType || !totalRows) {
//         return res.status(400).json({ success: false, message: "seatType and totalRows are required for Seater buses" });
//       }

//       const [rightSeats,leftSeats] = seatType.split("+").map(Number); // e.g., "2+2" → [2,2]

//       for (let row = 1; row <= totalRows; row++) {
//         const currentLeft = leftSeats;
//         const currentRight = (row === totalRows && lastRowSeats) ? lastRowSeats : rightSeats;

//         // Left Side
//         for (let col = 1; col <= currentLeft; col++) {
//           seats.push({
//             seatNumber: `L${row}${col}`,
//             row,
//             column: col,
//             deck: "SINGLE",
//             section: "LEFT",
//             type: "SEATER",
//             isWindow: col === 1,
//             isAisle: col === currentLeft
//           });
//         }

//         // Right Side
//         for (let col = 1; col <= currentRight; col++) {
//           seats.push({
//             seatNumber: `R${row}${col}`,
//             row,
//             column: col,
//             deck: "SINGLE",
//             section: "RIGHT",
//             type: "SEATER",
//             isWindow: col === currentRight,
//             isAisle: col === 1
//           });
//         }
//       }
//     }
//     else {
//       // ==================== SLEEPER BUS ====================
//       if (!seatType || !lowerDeckRows || !upperDeckRows) {
//         return res.status(400).json({ success: false, message: "seatType, lowerDeckRows and upperDeckRows are required for Sleeper buses" });
//       }

//       const [rightSeats,leftSeats ] = seatType.split("+").map(Number);

//       // Lower Deck
//       for (let row = 1; row <= lowerDeckRows; row++) {
//         for (let col = 1; col <= leftSeats; col++) {
//           seats.push({
//             seatNumber: `LL${row}${col}`,   // Lower Left
//             row,
//             column: col,
//             deck: "LOWER",
//             section: "LEFT",
//             type: "SLEEPER",
//             isWindow: col === 1
//           });
//         }
//         for (let col = 1; col <= rightSeats; col++) {
//           seats.push({
//             seatNumber: `LR${row}${col}`,   // Lower Right
//             row,
//             column: col,
//             deck: "LOWER",
//             section: "RIGHT",
//             type: "SLEEPER",
//             isWindow: col === rightSeats
//           });
//         }
//       }

//       // Upper Deck
//       for (let row = 1; row <= upperDeckRows; row++) {
//         for (let col = 1; col <= leftSeats; col++) {
//           seats.push({
//             seatNumber: `UL${row}${col}`,   // Upper Left
//             row,
//             column: col,
//             deck: "UPPER",
//             section: "LEFT",
//             type: "SLEEPER",
//             isWindow: col === 1
//           });
//         }
//         for (let col = 1; col <= rightSeats; col++) {
//           seats.push({
//             seatNumber: `UR${row}${col}`,   // Upper Right
//             row,
//             column: col,
//             deck: "UPPER",
//             section: "RIGHT",
//             type: "SLEEPER",
//             isWindow: col === rightSeats
//           });
//         }
//       }
//     }

//     // Update Bus with generated seats
//     bus.seatStructure = {
//       seats: seats
//     };
//     bus.totalSeats = seats.length;

//     await bus.save();

//     res.status(200).json({
//       success: true,
//       message: "Seat structure generated successfully",
//       totalSeats: seats.length,
//       data: bus
//     });

//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

export const generateBusSeats = async (req, res) => {
  try {
    const { busId } = req.params;
    const { seat_layout,seat_type } = req.body;

    const bus = await Bus.findById(busId);

    if (!bus) {
      return res.status(404).json({
        success: false,
        message: "Bus not found",
      });
    }

    if (
      !seat_layout ||
      !Array.isArray(seat_layout) ||
      seat_layout.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "seat_layout is required",
      });
    }

    bus.seat_type = seat_type

    const seats = seat_layout.map((seat) => ({
      seatName: seat.seatName,
      seatNumber: seat.seatId,
      row: seat.row,
      column: seat.column || 1,

      deck: seat.deck?.toUpperCase(),

      section: seat.section?.toUpperCase() || "LEFT",

      type: bus.busType.includes("Sleeper") ? "SLEEPER" : "SEATER",

      isWindow: seat.isWindow || false,
      isAisle: seat.isAisle || false,

      category: seat.category || "REGULAR",

      basePrice: seat.price || bus.baseFare,
    }));

    bus.seatStructure = {
      seats,
    };

    bus.totalSeats = seats.length;

    await bus.save();

    return res.status(200).json({
      success: true,
      message: "Seat structure generated successfully",
      totalSeats: seats.length,
      data: bus,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
