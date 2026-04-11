import BusTrip from "../models/BusTrip.model.js";
import Bus from "../models/Bus.model.js";
import Agency from "../models/Agency.model.js";

// export const createBusTrip = async (req, res) => {
//   try {
//     const {
//       busId,
//       startPoint,
//       endPoint,
//       departureDateTime,     // Optional base
//       arrivalDateTime,       // Optional base
//       departureTime,         // "22:30"
//       arrivalTime,           // "07:00"
//       travelDuration,
//       basePrice,
//       pricePerSeat,
//       pickupPoints,
//       dropPoints,

//       creationType,          // "single" | "daily" | "custom" | "random"
//       endDate,
//       dates                  // for random
//     } = req.body;

//     const bus = await Bus.findById(busId);
//     if (!bus) return res.status(404).json({ success: false, message: "Bus not found" });

//     let tripDates = [];

//     if (creationType === "single") {
//       tripDates.push(new Date(departureDateTime));
//     } 
//     else if (creationType === "daily" || creationType === "custom") {
//       const start = new Date(departureDateTime);
//       const end = new Date(endDate);

//       let current = new Date(start);
//       while (current <= end) {
//         tripDates.push(new Date(current));
//         current.setDate(current.getDate() + 1);
//       }
//     } 
//     else if (creationType === "random") {
//       if (!dates || !Array.isArray(dates) || dates.length === 0) {
//         return res.status(400).json({ success: false, message: "dates array is required for random type" });
//       }
//       tripDates = dates.map(d => new Date(d));
//     } 
//     else {
//       return res.status(400).json({ success: false, message: "Invalid creationType" });
//     }

//     // Remove duplicate dates
//     const uniqueDates = [...new Set(tripDates.map(d => d.toISOString().split('T')[0]))];

//     const createdTrips = [];

//     for (let dateStr of uniqueDates) {
//       const depDate = new Date(dateStr);

//       // Create Departure DateTime
//       const [depHour, depMin] = departureTime.split(":").map(Number);
//       const finalDeparture = new Date(depDate);
//       finalDeparture.setHours(depHour, depMin, 0, 0);

//       // Create Arrival DateTime
//       const [arrHour, arrMin] = arrivalTime.split(":").map(Number);
//       let finalArrival = new Date(depDate);

//       // If arrival time is next day (e.g., 22:30 → 07:00)
//       if (arrHour < depHour || (arrHour === depHour && arrMin < depMin)) {
//         finalArrival.setDate(finalArrival.getDate() + 1);
//       }
//       finalArrival.setHours(arrHour, arrMin, 0, 0);

//       const newTrip = new BusTrip({
//         bus: busId,
//         tripCode: `${bus.busNo}-${dateStr.replace(/-/g, '')}`,
//         startPoint,
//         endPoint,
//         departureDateTime: finalDeparture,
//         arrivalDateTime: finalArrival,
//         departureDate: dateStr,
//         departureTime,
//         arrivalDate: finalArrival.toISOString().split('T')[0],
//         arrivalTime,
//         travelDuration,
//         basePrice,
//         pricePerSeat: pricePerSeat || new Map(),
//         pickupPoints: pickupPoints || [],
//         dropPoints: dropPoints || [],
//         totalSeats: bus.totalSeats,
//         availableSeats: bus.totalSeats,
//       });

//       await newTrip.save();
//       createdTrips.push(newTrip);
//     }

//     res.status(201).json({
//       success: true,
//       message: `${createdTrips.length} trip(s) created successfully`,
//       totalCreated: createdTrips.length,
//       data: createdTrips
//     });

//   } catch (error) {
//     console.error(error); // Helpful for debugging
//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };


export const createBusTrip = async (req, res) => {
  try {
    const {
      busId,
      startPoint,
      endPoint,
      departureTime,
      arrivalTime,
      travelDuration,
      basePrice,
      pricePerSeat,
      pickupPoints,
      dropPoints,

      creationType,
      endDate,
      dates
    } = req.body;

    const bus = await Bus.findById(busId);
    if (!bus) return res.status(404).json({ success: false, message: "Bus not found" });

    if (!bus.seatStructure?.seats?.length) {
      return res.status(400).json({ 
        success: false, 
        message: "Seat structure not generated for this bus yet." 
      });
    }

    // ==================== Prepare Trip Dates ====================
    let tripDates = [];

    if (creationType === "single") {
      tripDates.push(new Date(req.body.departureDateTime));
    } else if (creationType === "daily" || creationType === "custom") {
      const start = new Date(req.body.departureDateTime);
      const end = new Date(endDate);
      let current = new Date(start);
      while (current <= end) {
        tripDates.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }
    } else if (creationType === "random") {
      tripDates = dates.map(d => new Date(d));
    }

    const uniqueDates = [...new Set(tripDates.map(d => d.toISOString().split('T')[0]))];
    const createdTrips = [];
    const skippedTrips = [];

    // ==================== Check & Create Trips ====================
    for (let dateStr of uniqueDates) {

      // 🔥 Duplicate Check
      const existingTrip = await BusTrip.findOne({
        bus: busId,
        departureDate: dateStr
      });

      if (existingTrip) {
        skippedTrips.push({ date: dateStr, reason: "Trip already exists for this bus on this date" });
        continue; // Skip this date
      }

      // Create Departure & Arrival Time
      const depDate = new Date(dateStr);
      const [depHour, depMin] = departureTime.split(":").map(Number);
      const finalDeparture = new Date(depDate);
      finalDeparture.setHours(depHour, depMin, 0, 0);

      const [arrHour, arrMin] = arrivalTime.split(":").map(Number);
      let finalArrival = new Date(depDate);
      if (arrHour < depHour || (arrHour === depHour && arrMin < depMin)) {
        finalArrival.setDate(finalArrival.getDate() + 1);
      }
      finalArrival.setHours(arrHour, arrMin, 0, 0);

      // Generate Seats
      const tripSeats = bus.seatStructure.seats.map(seat => ({
        seatNo: seat.seatNumber,
        deck: seat.deck,
        seatPrice: pricePerSeat?.[seat.deck] || basePrice,
        seatType: seat.type,
        seatFor: "None",
        status: "available",
        bookedBy: null,
        genderBooked: null
      }));

      const newTrip = new BusTrip({
        bus: busId,
        tripCode: `${bus.busNo}-${dateStr.replace(/-/g, '')}`,
        startPoint,
        endPoint,
        departureDateTime: finalDeparture,
        arrivalDateTime: finalArrival,
        departureDate: dateStr,
        departureTime,
        arrivalDate: finalArrival.toISOString().split('T')[0],
        arrivalTime,
        travelDuration,
        basePrice,
        pricePerSeat: pricePerSeat || {},
        amenities: bus.amenities || [],
        features: bus.features || [],
        busImages: bus.images || [],
        busRatings: {
    average: bus.ratings?.average || 0,
    totalReviews: bus.ratings?.totalReviews || 0,
    distribution: bus.ratings?.distribution || {
      1: { count: 0, percentage: 0 },
      2: { count: 0, percentage: 0 },
      3: { count: 0, percentage: 0 },
      4: { count: 0, percentage: 0 },
      5: { count: 0, percentage: 0 }
    }
  },
        pickupPoints: pickupPoints || [],
        dropPoints: dropPoints || [],
        seats: tripSeats,
        totalSeats: tripSeats.length,
        availableSeats: tripSeats.length,
      });

      await newTrip.save();
      createdTrips.push(newTrip);
    }

    res.status(201).json({
      success: true,
      message: `${createdTrips.length} trip(s) created successfully`,
      totalCreated: createdTrips.length,
      skipped: skippedTrips.length,
      createdTrips,
      skippedTrips
    });

  } catch (error) {
    console.error("Create Trip Error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
export const getBusTrips = async (req, res) => {
  try {
    const { page = 1, limit = 10, busId, departureDate, status, startPoint, endPoint } = req.query;

    const query = {};
    if (busId) query.bus = busId;
    if (departureDate) query.departureDate = departureDate;
    if (status) query.status = status;
    if (startPoint) query.startPoint = startPoint;
    if (endPoint) query.endPoint = endPoint;

    // const trips = await BusTrip.find(query)
    //   .populate("bus", "travelAgency busNo busType registrationNumber")
    //   .sort({ departureDateTime: 1 })
    //   .skip((page - 1) * limit)
    //   .limit(parseInt(limit));


    const trips = await BusTrip.find(query)
    // .populate("bus", "travelAgency busNo busType registrationNumber")
  .populate({
    path: "bus",
    select: "travelAgency busNo busType registrationNumber",
    populate: {
      path: "travelAgency",
      select: "name"
    }
  })
  .sort({ departureDateTime: 1 })
  .skip((page - 1) * limit)
  .limit(parseInt(limit));

console.log(trips[0].bus.travelAgency);
// console.log(trips[0].bus.toObject());
// const agency = await Agency.findById("67f8b2c9d5e4a12345678901");
// console.log(agency);
    const total = await BusTrip.countDocuments(query);

    res.status(200).json({
      success: true,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: trips
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ====================== GET BUS TRIP BY ID ======================
export const getBusTripById = async (req, res) => {
  try {
    const trip = await BusTrip.findById(req.params.id)
      .populate("bus", "busNo busType ratings images amenities features");

    if (!trip) {
      return res.status(404).json({ success: false, message: "Bus trip not found" });
    }

    res.status(200).json({
      success: true,
      data: trip
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ====================== UPDATE BUS TRIP ======================
export const updateBusTrip = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Prevent updating critical fields that can break consistency
    delete updateData.seats;
    delete updateData.totalSeats;
    delete updateData.availableSeats;
    delete updateData.bus;

    const updatedTrip = await BusTrip.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate("bus", "busNo busType");

    if (!updatedTrip) {
      return res.status(404).json({ success: false, message: "Bus trip not found" });
    }

    res.status(200).json({
      success: true,
      message: "Bus trip updated successfully",
      data: updatedTrip
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ====================== CHANGE BUS TRIP STATUS ======================
export const changeBusTripStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["active", "cancelled", "completed", "delayed"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const trip = await BusTrip.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!trip) {
      return res.status(404).json({ success: false, message: "Bus trip not found" });
    }

    res.status(200).json({
      success: true,
      message: `Bus trip status changed to ${status}`,
      data: trip
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ====================== DELETE BUS TRIP ======================
export const deleteBusTrip = async (req, res) => {
  try {
    const trip = await BusTrip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({ success: false, message: "Bus trip not found" });
    }

    // Safety Check: Don't delete if seats are booked
    const bookedSeats = trip.seats.filter(s => s.status === "booked").length;
    if (bookedSeats > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete trip. ${bookedSeats} seats are already booked.`
      });
    }

    await BusTrip.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Bus trip deleted successfully"
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ====================== SEARCH BUS TRIPS ======================
export const searchBusTrips = async (req, res) => {
  try {
    const { startPoint, endPoint, departureDate, busType, minPrice, maxPrice } = req.query;

    if (!startPoint || !endPoint || !departureDate) {
      return res.status(400).json({
        success: false,
        message: "startPoint, endPoint and departureDate are required"
      });
    }

    const query = {
      startPoint: { $regex: startPoint, $options: "i" },
      endPoint: { $regex: endPoint, $options: "i" },
      departureDate: departureDate,
      status: "active"                    // Only show active trips
    };

    // Optional filters
    if (busType) {
      query['bus.busType'] = busType;
    }
    if (minPrice || maxPrice) {
      query.basePrice = {};
      if (minPrice) query.basePrice.$gte = Number(minPrice);
      if (maxPrice) query.basePrice.$lte = Number(maxPrice);
    }

    const trips = await BusTrip.find(query)
      .populate("bus", "busNo busType ratings images manufacturer model")
      .select("-seats")                    // Don't send full seats array (too heavy)
      .sort({ departureDateTime: 1 });

    res.status(200).json({
      success: true,
      total: trips.length,
      departureDate,
      startPoint,
      endPoint,
      data: trips
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error searching bus trips"
    });
  }
};