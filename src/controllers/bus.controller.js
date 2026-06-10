import BusTrip from "../models/BusTrip.model.js";
import Bus from "../models/Bus.model.js";
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
        message: "startPoint, endPoint and date are required"
      });
    }

    // ✅ Query (Exact Match on departureDate)
    const buses = await BusTrip.find({
      startPoint: { $regex: new RegExp(`^${startPoint}$`, "i") }, // case-insensitive
      endPoint: { $regex: new RegExp(`^${endPoint}$`, "i") },
      departureDate: date,
      status: "active"
    }).populate("bus"); // optional

    return res.status(200).json({
      success: true,
      count: buses.length,
      data: buses
    });

  } catch (error) {
    console.error("Search Bus Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
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

      busData.images = req.files.map(file => {
        return `/uploads/buses/${file.filename}`;
      });

    }

    const newBus = new Bus(busData);
    await newBus.save();

    res.status(201).json({
      success: true,
      message: "Bus created successfully",
      data: newBus
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Error creating bus"
    });
  }
};

// Get All Buses (with pagination and filters)
export const getBusList = async (req, res) => {
  try {

    // const userId = req.user.id;
    // const userRole = req.user.role;

    const {
      page = 1,
      limit = 10,
      search = "",
      status,
      busType
    } = req.query;

    // Base query
    const query = {};

    // If not admin, show only own buses
    // if (userRole !== "ADMIN") {
    //   query.createdBy = userId;
    // }

    // Search filter
    if (search) {
      query.$or = [
        { busName: { $regex: search, $options: "i" } },
        { busNo: { $regex: search, $options: "i" } },
        { registrationNumber: { $regex: search, $options: "i" } }
      ];
    }

    // Status filter
    if (status) {
      query.status = status;
    }

    // Bus type filter
    if (busType) {
      query.busType = busType;
    }

    const buses = await Bus.find(query)
      .populate("travelAgency")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Bus.countDocuments(query);

    res.status(200).json({
      success: true,
      total,
      currentPage: Number(page),
      totalPages: Math.ceil(total / limit),
      data: buses
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching buses"
    });
  }
};

// Get Bus by ID
export const getBusById = async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id)
      .populate("travelAgency", "name email contactNumber address");

    if (!bus) {
      return res.status(404).json({
        success: false,
        message: "Bus not found"
      });
    }

    res.status(200).json({
      success: true,
      data: bus
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching bus details"
    });
  }
};

// Update Bus
export const updateBus = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedBus = await Bus.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    ).populate("travelAgency");

    if (!updatedBus) {
      return res.status(404).json({
        success: false,
        message: "Bus not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Bus updated successfully",
      data: updatedBus
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Error updating bus"
    });
  }
};

// Delete Bus
export const deleteBus = async (req, res) => {
  try {
    const bus = await Bus.findByIdAndDelete(req.params.id);

    if (!bus) {
      return res.status(404).json({
        success: false,
        message: "Bus not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Bus deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting bus"
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
        message: "Invalid status"
      });
    }

    const bus = await Bus.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!bus) {
      return res.status(404).json({
        success: false,
        message: "Bus not found"
      });
    }

    res.status(200).json({
      success: true,
      message: `Bus status changed to ${status}`,
      data: bus
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error changing bus status"
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
    const { seat_layout } = req.body;

    const bus = await Bus.findById(busId);

    if (!bus) {
      return res.status(404).json({
        success: false,
        message: "Bus not found"
      });
    }

    if (!seat_layout || !Array.isArray(seat_layout) || seat_layout.length === 0) {
      return res.status(400).json({
        success: false,
        message: "seat_layout is required"
      });
    }

    const seats = seat_layout.map((seat) => ({
      seatNumber: seat.seatName,
      row: seat.row,
      column: seat.column || 1,

      deck:
        seat.type?.toUpperCase() === "UPPER"
          ? "UPPER"
          : seat.type?.toUpperCase() === "LOWER"
          ? "LOWER"
          : "SINGLE",

      section: seat.section?.toUpperCase() || "LEFT",

      type: bus.busType.includes("Sleeper")
        ? "SLEEPER"
        : "SEATER",

      isWindow: seat.isWindow || false,
      isAisle: seat.isAisle || false,

      category: seat.category || "REGULAR",

      basePrice: seat.price || bus.baseFare
    }));

    bus.seatStructure = {
      seats
    };

    bus.totalSeats = seats.length;

    await bus.save();

    return res.status(200).json({
      success: true,
      message: "Seat structure generated successfully",
      totalSeats: seats.length,
      data: bus
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

