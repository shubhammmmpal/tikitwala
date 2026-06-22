import BusTrip from "../models/BusTrip.model.js";
import Bus from "../models/Bus.model.js";
import Agency from "../models/Agency.model.js";
import City from "../models/city.model.js";

export const createBusTrip = async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      busId,
      startPoint,
      endPoint,
      stopPoints = [],

      departureTime,
      arrivalTime,

      travelDuration,

      basePrice,
      pricePerSeat,

      pickupPoints = [],
      dropPoints = [],

      creationType,
      endDate,
      dates,
    } = req.body;

    // =========================
    // CHECK BUS
    // =========================

    const bus = await Bus.findById(busId);

    if (!bus) {
      return res.status(404).json({
        success: false,
        message: "Bus not found",
      });
    }

    if (!bus.seatStructure?.seats?.length) {
      return res.status(400).json({
        success: false,
        message: "Seat structure not generated for this bus yet.",
      });
    }

    // =========================
    // PREPARE DATES
    // =========================

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
      tripDates = dates.map((d) => new Date(d));
    }

    // =========================
    // REMOVE DUPLICATES
    // =========================

    const uniqueDates = [
      ...new Set(tripDates.map((d) => d.toISOString().split("T")[0])),
    ];

    const createdTrips = [];
    const skippedTrips = [];

    // =========================
    // LOOP DATES
    // =========================

    for (let dateStr of uniqueDates) {
      // =========================
      // CHECK DUPLICATE TRIP
      // =========================

      const existingTrip = await BusTrip.findOne({
        bus: busId,
        departureDate: dateStr,
      });

      if (existingTrip) {
        skippedTrips.push({
          date: dateStr,
          reason: "Trip already exists for this bus on this date",
        });

        continue;
      }

      // =========================
      // CREATE DEPARTURE DATETIME
      // =========================

      const depDate = new Date(dateStr);

      const [depHour, depMin] = departureTime.split(":").map(Number);

      const finalDeparture = new Date(depDate);

      finalDeparture.setHours(depHour, depMin, 0, 0);

      // =========================
      // CREATE ARRIVAL DATETIME
      // =========================

      const [arrHour, arrMin] = arrivalTime.split(":").map(Number);

      let finalArrival = new Date(depDate);

      // NEXT DAY ARRIVAL

      if (arrHour < depHour || (arrHour === depHour && arrMin < depMin)) {
        finalArrival.setDate(finalArrival.getDate() + 1);
      }

      finalArrival.setHours(arrHour, arrMin, 0, 0);

      // =========================
      // GENERATE SEATS
      // =========================

      const tripSeats = bus.seatStructure.seats.map((seat) => ({
        seatNo: seat.seatNumber,

        seatName: seat.seatName,
        deck: seat.deck,

        seatPrice: pricePerSeat?.[seat.deck] || basePrice,

        seatType: seat.type,

        seatFor: "None",

        status: "available",

        bookedBy: null,

        genderBooked: null,
      }));

      // =========================
      // FORMAT STOP POINTS
      // =========================

      const formattedStopPoints = stopPoints.map((stop, index) => ({
        city: stop.city,

        arrivalTime: stop.arrivalTime ? new Date(stop.arrivalTime) : null,

        departureTime: stop.departureTime ? new Date(stop.departureTime) : null,

        order: stop.order || index + 1,
        address: stop.address || "",
      }));

      // =========================
      // FORMAT PICKUP POINTS
      // =========================

      const formattedPickupPoints = pickupPoints.map((item) => ({
        city: item.city,

        points: item.points.map((point) => ({
          name: point.name,

          datetime: new Date(point.datetime),

          address: point.address || "",
        })),
      }));

      // =========================
      // FORMAT DROP POINTS
      // =========================

      const formattedDropPoints = dropPoints.map((item) => ({
        city: item.city,

        points: item.points.map((point) => ({
          name: point.name,

          datetime: new Date(point.datetime),

          address: point.address || "",
        })),
      }));

      // =========================
      // CREATE TRIP
      // =========================

      const newTrip = new BusTrip({
        bus: busId,

        tripCode: `${bus.busNo}-${dateStr.replace(/-/g, "")}`,

        platformType: "BUS",

        // =========================
        // ROUTE
        // =========================

        startPoint,

        endPoint,

        stopPoints: formattedStopPoints,

        // =========================
        // DATETIME
        // =========================

        departureDateTime: finalDeparture,

        arrivalDateTime: finalArrival,

        departureDate: dateStr,

        arrivalDate: finalArrival.toISOString().split("T")[0],

        departureTime,

        arrivalTime,

        travelDuration,

        // =========================
        // PRICE
        // =========================

        basePrice,

        pricePerSeat: pricePerSeat || {},

        // =========================
        // BUS DATA
        // =========================

        amenities: bus.amenities || [],

        features: bus.features || [],

        busImages: bus.images || [],

        // =========================
        // RATINGS
        // =========================

        ratings: {
          average: bus.ratings?.average || 0,

          totalReviews: bus.ratings?.totalReviews || 0,

          distribution: bus.ratings?.distribution || {
            1: {
              count: 0,
              percentage: 0,
            },

            2: {
              count: 0,
              percentage: 0,
            },

            3: {
              count: 0,
              percentage: 0,
            },

            4: {
              count: 0,
              percentage: 0,
            },

            5: {
              count: 0,
              percentage: 0,
            },
          },
        },

        // =========================
        // PICKUP & DROP
        // =========================

        pickupPoints: formattedPickupPoints,

        dropPoints: formattedDropPoints,

        createdBy: userId,

        // =========================
        // SEATS
        // =========================

        seats: tripSeats,

        totalSeats: tripSeats.length,

        availableSeats: tripSeats.length,
      });

      // =========================
      // SAVE
      // =========================

      await newTrip.save();

      createdTrips.push(newTrip);
    }

    // =========================
    // RESPONSE
    // =========================

    return res.status(201).json({
      success: true,

      message: `${createdTrips.length} trip(s) created successfully`,

      totalCreated: createdTrips.length,

      skipped: skippedTrips.length,

      createdTrips,

      skippedTrips,
    });
  } catch (error) {
    console.error("Create Trip Error:", error);

    return res.status(500).json({
      success: false,

      message: error.message,
    });
  }
};

export const getBusTrips = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      busId,
      departureDate,
      status,
      startPoint,
      endPoint,
    } = req.query;

    // return
    const pageNumber = Number(page) || 1;
    const limitNumber = Number(limit) || 10;

    const query = {};

    // Role-based filtering
    if (req.user.role !== "Admin") {
      query.createdBy = req.user.id;
    }

    // Other filters
    if (busId) query.bus = busId;
    if (departureDate) query.departureDate = departureDate;
    if (status) query.status = status;
    if (startPoint) query.startPoint = startPoint;
    if (endPoint) query.endPoint = endPoint;

    const trips = await BusTrip.find(query)
      .populate({
        path: "bus",
        select: "travelAgency busNo busName busType registrationNumber",
        populate: {
          path: "travelAgency",
          select: "name",
        },
      })
      .populate({
        path: "startPoint",
        model: "City",
        select: "city_name city_id state_id",
      })
      .populate({
        path: "endPoint",
        model: "City",
        select: "city_name city_id state_id",
      })
      .populate({
        path: "stopPoints.city",
        model: "City",
        select: "city_name city_id state_id",
      })
      .populate({
        path: "pickupPoints.city",
        model: "City",
        select: "city_name city_id state_id",
      })
      .populate({
        path: "dropPoints.city",
        model: "City",
        select: "city_name city_id state_id",
      })
      .sort({ departureDateTime: 1 })
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber);

    const total = await BusTrip.countDocuments(query);
    const tripsWithSeatStats = trips.map((trip) => {
      const totalSeats = trip.seats.length;

      const bookedSeats = trip.seats.filter(
        (seat) => seat.status === "booked",
      ).length;

      return {
        ...trip.toObject(),
        totalSeats,
        bookedSeats,
        availableSeats: totalSeats - bookedSeats,
      };
    });

    return res.status(200).json({
      success: true,
      total,
      totalPages: Math.ceil(total / limitNumber),
      currentPage: pageNumber,
      data: tripsWithSeatStats,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ====================== GET BUS TRIP BY ID ======================
export const getBusTripById = async (req, res) => {
  try {
    const trip = await BusTrip.findById(req.params.id)

      // ======================
      // BUS
      // ======================

      .populate({
        path: "bus",
        select:
          "travelAgency busNo busName busType registrationNumber ratings images amenities features",
        populate: {
          path: "travelAgency",
          select: "name",
        },
      })

      // ======================
      // START POINT
      // ======================

      .populate({
        path: "startPoint",
        model: "City",
        select: "city_name city_id state_id",
      })

      // ======================
      // END POINT
      // ======================

      .populate({
        path: "endPoint",
        model: "City",
        select: "city_name city_id state_id",
      })

      // ======================
      // STOP POINTS
      // ======================

      .populate({
        path: "stopPoints.city",
        model: "City",
        select: "city_name city_id state_id",
      })

      // ======================
      // PICKUP POINTS
      // ======================

      .populate({
        path: "pickupPoints.city",
        model: "City",
        select: "city_name city_id state_id",
      })

      // ======================
      // DROP POINTS
      // ======================

      .populate({
        path: "dropPoints.city",
        model: "City",
        select: "city_name city_id state_id",
      });

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Bus trip not found",
      });
    }

    const totalSeats = trip.seats.length;

    const bookedSeats = trip.seats.filter(
      (seat) => seat.status === "booked",
    ).length;

    const availableSeats = trip.seats.filter(
      (seat) => seat.status === "available",
    ).length;

    const blockedSeats = trip.seats.filter(
      (seat) => seat.status === "blocked",
    ).length;

    return res.status(200).json({
      success: true,
      data: {
        ...trip.toObject(),
        seatStats: {
          totalSeats,
          bookedSeats,
          availableSeats,
          blockedSeats,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
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

    const updatedTrip = await BusTrip.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate("bus", "busNo busType");

    if (!updatedTrip) {
      return res
        .status(404)
        .json({ success: false, message: "Bus trip not found" });
    }

    res.status(200).json({
      success: true,
      message: "Bus trip updated successfully",
      data: updatedTrip,
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
      return res
        .status(400)
        .json({ success: false, message: "Invalid status" });
    }

    const trip = await BusTrip.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true },
    );

    if (!trip) {
      return res
        .status(404)
        .json({ success: false, message: "Bus trip not found" });
    }

    res.status(200).json({
      success: true,
      message: `Bus trip status changed to ${status}`,
      data: trip,
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
      return res
        .status(404)
        .json({ success: false, message: "Bus trip not found" });
    }

    // Safety Check: Don't delete if seats are booked
    const bookedSeats = trip.seats.filter((s) => s.status === "booked").length;
    if (bookedSeats > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete trip. ${bookedSeats} seats are already booked.`,
      });
    }

    await BusTrip.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Bus trip deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ====================== SEARCH BUS TRIPS ======================
export const searchBusTrips = async (req, res) => {
  try {
    const { startPoint, endPoint, departureDate, busType, minPrice, maxPrice } =
      req.query;

    // =========================
    // VALIDATION
    // =========================

    if (!startPoint || !endPoint || !departureDate) {
      return res.status(400).json({
        success: false,
        message: "startPoint, endPoint and departureDate are required",
      });
    }

    // =========================
    // MAIN QUERY
    // =========================

    const query = {
      departureDate,
      status: "active",

      $and: [
        // =========================
        // START POINT CONDITION
        // =========================

        {
          $or: [
            // exact start city
            {
              startPoint: startPoint,
            },

            // stop point city
            {
              "stopPoints.city": startPoint,
            },
          ],
        },

        // =========================
        // END POINT CONDITION
        // =========================

        {
          $or: [
            // exact end city
            {
              endPoint: endPoint,
            },

            // stop point city
            {
              "stopPoints.city": endPoint,
            },
          ],
        },
      ],
    };

    // =========================
    // PRICE FILTER
    // =========================

    if (minPrice || maxPrice) {
      query.basePrice = {};

      if (minPrice) {
        query.basePrice.$gte = Number(minPrice);
      }

      if (maxPrice) {
        query.basePrice.$lte = Number(maxPrice);
      }
    }

    // =========================
    // FIND
    // =========================

    let trips = await BusTrip.find(query)

      .populate({
        path: "bus",
        select:
          "travelAgency busNo busName busType registrationNumber ratings images amenities features manufacturer model",
        populate: {
          path: "travelAgency",
          select: "name",
        },
      })

      .populate({
        path: "startPoint",
        model: "City",
        select: "city_name city_id",
      })

      .populate({
        path: "endPoint",
        model: "City",
        select: "city_name city_id",
      })

      .populate({
        path: "stopPoints.city",
        model: "City",
        select: "city_name city_id",
      })

      .populate({
        path: "pickupPoints.city",
        model: "City",
        select: "city_name city_id",
      })

      .populate({
        path: "dropPoints.city",
        model: "City",
        select: "city_name city_id",
      })

      .select("-seats")

      .sort({ departureDateTime: 1 });

    // =========================
    // BUS TYPE FILTER
    // =========================

    if (busType) {
      trips = trips.filter((trip) => trip.bus?.busType === busType);
    }

    // =========================
    // OPTIONAL:
    // REMOVE INVALID ROUTES
    // =========================
    // Prevent reverse routes
    // Example:
    // Hyderabad -> Dewas should NOT work

    trips = trips
      .filter((trip) => {
        const route = [
          trip.startPoint?._id?.toString(),

          ...trip.stopPoints.map((stop) => stop.city?._id?.toString()),

          trip.endPoint?._id?.toString(),
        ];

        const startIndex = route.indexOf(startPoint);
        const endIndex = route.indexOf(endPoint);

        return startIndex !== -1 && endIndex !== -1 && startIndex < endIndex;
      })

      .map((trip) => {
        // =========================
        // FULL ROUTE
        // =========================

        const fullRoute = [
          {
            type: "start",
            city: trip.startPoint,
          },

          ...trip.stopPoints.map((stop) => ({
            type: "stop",
            city: stop.city,
            arrivalTime: stop.arrivalTime,
            departureTime: stop.departureTime,
            order: stop.order,
          })),

          {
            type: "end",
            city: trip.endPoint,
          },
        ];

        // =========================
        // FIND START INDEX
        // =========================

        const startIndex = fullRoute.findIndex(
          (item) => item?.city?._id?.toString() === startPoint,
        );

        // =========================
        // FIND END INDEX
        // =========================

        const endIndex = fullRoute.findIndex(
          (item) => item?.city?._id?.toString() === endPoint,
        );

        // =========================
        // ROUTE SLICE
        // =========================

        const selectedRoute = fullRoute.slice(startIndex, endIndex + 1);

        // =========================
        // START & END
        // =========================

        const newStartPoint = selectedRoute[0]?.city || null;

        const newEndPoint =
          selectedRoute[selectedRoute.length - 1]?.city || null;

        // =========================
        // STOPS
        // =========================

        const newStopPoints = selectedRoute
          .filter((item) => item?.type === "stop")
          .map((item) => ({
            city: item.city,
            arrivalTime: item.arrivalTime,
            departureTime: item.departureTime,
            order: item.order,
          }));

        // =========================
        // PICKUP POINTS
        // =========================

        const pickupPoints = trip.pickupPoints.filter(
          (point) => point?.city?._id?.toString() === startPoint,
        );

        // =========================
        // DROP POINTS
        // =========================

        const dropPoints = trip.dropPoints.filter(
          (point) => point?.city?._id?.toString() === endPoint,
        );

        // =========================
        // RETURN
        // =========================

        return {
          ...trip.toObject(),

          startPoint: newStartPoint,

          endPoint: newEndPoint,

          stopPoints: newStopPoints,

          pickupPoints,

          dropPoints,
        };
      });

    // =========================
    // RESPONSE
    // =========================

    return res.status(200).json({
      success: true,
      total: trips.length,
      departureDate,
      startPoint,
      endPoint,
      data: trips,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Error searching bus trips",
      error: error.message,
    });
  }
};

// ==========================================
// UPDATE SEAT PRICE
// ==========================================

export const updateSeatPrice = async (req, res) => {
  try {
    const { busTripId, seats, seatPrice } = req.body;

    // ==========================================
    // VALIDATION
    // ==========================================

    if (!busTripId) {
      return res.status(400).json({
        success: false,
        message: "busTripId is required",
      });
    }

    if (!Array.isArray(seats) || seats.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Seats array is required",
      });
    }

    if (seatPrice == null) {
      return res.status(400).json({
        success: false,
        message: "seatPrice is required",
      });
    }

    // ==========================================
    // UPDATE SEAT PRICES
    // ==========================================

    const updatedTrip = await BusTrip.findOneAndUpdate(
      {
        _id: busTripId,
      },

      {
        $set: {
          "seats.$[elem].seatPrice": seatPrice,
        },
      },

      {
        arrayFilters: [
          {
            "elem.seatNo": { $in: seats },
          },
        ],

        new: true,
      },
    );

    // ==========================================
    // NOT FOUND
    // ==========================================

    if (!updatedTrip) {
      return res.status(404).json({
        success: false,
        message: "Bus trip not found",
      });
    }

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,
      message: "Seat prices updated successfully",
      data: updatedTrip,
    });
  } catch (error) {
    console.error("Update Seat Price Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// ==========================================
// UPDATE SEAT TYPE
// ==========================================

export const getFareSummary = async (req, res) => {
  try {
    const { tripId, selectedSeats } = req.body;

    if (!tripId || !selectedSeats?.length) {
      return res.status(400).json({
        success: false,
        message: "Trip ID and seats are required",
      });
    }

    const trip = await BusTrip.findById(tripId);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Trip not found",
      });
    }

    // Get selected seat details
    const seats = trip.seats.filter((seat) =>
      selectedSeats.includes(seat.seatNo),
    );

    if (!seats.length) {
      return res.status(400).json({
        success: false,
        message: "No valid seats found",
      });
    }

    // Total seat amount
    const totalSeatAmount = seats.reduce(
      (sum, seat) => sum + seat.seatPrice,
      0,
    );

    // Charges
    const convenienceFee = 50 * seats.length; // 2%
    // const platformFee = 50 * seats.length; // ₹20 per seat

    // const taxableAmount =
    //   totalSeatAmount +
    //   convenienceFee
    //   // platformFee;

    const gstAmount = totalSeatAmount * 0.18;

    const totalAmount = totalSeatAmount + convenienceFee + gstAmount;

    return res.status(200).json({
      success: true,
      data: {
        totalSeatAmount: Number(totalSeatAmount.toFixed(2)),
        convenienceFee: Number(convenienceFee.toFixed(2)),
        // platformFee: Number(platformFee.toFixed(2)),
        gstAmount: Number(gstAmount.toFixed(2)),
        totalAmount: Number(totalAmount.toFixed(2)),
        selectedSeats: seats.map((seat) => ({
          seatNo: seat.seatNo,
          seatName: seat.seatName,
          price: seat.seatPrice,
        })),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateSeatType = async (req, res) => {
  try {
    const { busTripId, seats, seatType } = req.body;

    // ==========================================
    // VALIDATION
    // ==========================================

    if (!busTripId) {
      return res.status(400).json({
        success: false,
        message: "busTripId is required",
      });
    }

    if (!Array.isArray(seats) || seats.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Seats array is required",
      });
    }

    if (!seatType) {
      return res.status(400).json({
        success: false,
        message: "seatType is required",
      });
    }

    // ==========================================
    // VALID SEAT TYPES
    // ==========================================

    const validSeatTypes = ["SEATER", "SLEEPER", "SEMI_SLEEPER"];

    if (!validSeatTypes.includes(seatType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid seatType",
        allowed: validSeatTypes,
      });
    }

    // ==========================================
    // UPDATE MULTIPLE SEAT TYPES
    // ==========================================

    const updatedTrip = await BusTrip.findOneAndUpdate(
      {
        _id: busTripId,
      },

      {
        $set: {
          "seats.$[elem].seatType": seatType,
        },
      },

      {
        arrayFilters: [
          {
            "elem.seatNo": {
              $in: seats,
            },
          },
        ],

        new: true,
      },
    );

    // ==========================================
    // NOT FOUND
    // ==========================================

    if (!updatedTrip) {
      return res.status(404).json({
        success: false,
        message: "Bus trip not found",
      });
    }

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,
      message: "Seat types updated successfully",
      data: updatedTrip,
    });
  } catch (error) {
    console.error("Update Multiple Seat Types Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const getUpcomingTrips = async (req, res) => {
  try {
    const userId = req.user.id;
    const { search, busName } = req.query;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let cityIds = [];
    let busIds = [];

    // Search Cities
    if (search) {
      const cities = await City.find({
        city_name: { $regex: search, $options: "i" },
      }).select("_id");

      cityIds = cities.map((city) => city._id);
    }

    // Search Bus Names
    if (busName) {
      const buses = await Bus.find({
        busName: { $regex: busName, $options: "i" },
      }).select("_id");

      busIds = buses.map((bus) => bus._id);
    }

    const query = {
      createdBy: userId,
      departureDateTime: { $gte: today },
      status: "active",
    };

    const filters = [];

    if (search) {
      filters.push(
        { startPoint: { $in: cityIds } },
        { endPoint: { $in: cityIds } },
      );
    }

    if (busName) {
      filters.push({ bus: { $in: busIds } });
    }

    if (filters.length > 0) {
      query.$or = filters;
    }

    const trips = await BusTrip.find(query)
      .populate("bus", "busName")
      .populate("startPoint", "city_name")
      .populate("endPoint", "city_name")
      .select(
        "bus startPoint endPoint departureDate departureDateTime arrivalDate",
      )
      .sort({ departureDateTime: 1 });

    return res.status(200).json({
      success: true,
      count: trips.length,
      data: trips,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const changeBusInTrip = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { busId } = req.body;
    const userId = req.user?.id || req.headers["user-id"];

    if (!busId) {
      return res.status(400).json({
        success: false,
        message: "Bus ID is required",
      });
    }

    const trip = await BusTrip.findOne({
      _id: tripId,
      createdBy: userId,
    });

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Bus trip not found",
      });
    }

    const bus = await Bus.findById(busId);

    if (!bus) {
      return res.status(404).json({
        success: false,
        message: "Bus not found",
      });
    }

    trip.bus = busId;

    await trip.save();

    return res.status(200).json({
      success: true,
      message: "Bus changed successfully",
      data: trip,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
