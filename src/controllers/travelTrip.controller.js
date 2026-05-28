import TravelTrip from "../models/travelTrip.model.js";


// =========================
// CREATE TRAVEL TRIP
// =========================
export const createTravelTrip = async (req, res) => {
  try {

    const normalizeArray = (field) => {
      if (!field) return [];

      return Array.isArray(field)
        ? field
        : [field];
    };

    // Normalize arrays
    req.body.cityIds = normalizeArray(req.body.cityIds);
    req.body.vibe = normalizeArray(req.body.vibe);
    req.body.madeFor = normalizeArray(req.body.madeFor);
    req.body.inclusions = normalizeArray(req.body.inclusions);

    // SAVE IMAGE PATHS
    if (req.files && req.files.length > 0) {

      req.body.images = req.files.map(
        file => file.path
      );

    } else {

      req.body.images = [];

    }

    console.log("BODY =>", req.body);
    console.log("FILES =>", req.files);

    const trip = await TravelTrip.create(req.body);

    res.status(201).json({
      success: true,
      data: trip,
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

// =========================
// GET ALL TRAVEL TRIPS
// =========================
export const getAllTravelTrips = async (req, res) => {
  try {
    const trips = await TravelTrip.find()
      .populate("cityIds")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: trips.length,
      data: trips,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// =========================
// GET TRAVEL TRIP BY ID
// =========================
export const getTravelTripById = async (req, res) => {
  try {
    const trip = await TravelTrip.findById(req.params.id)
      .populate("cityIds")
      .populate("createdBy", "name email");

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Travel trip not found",
      });
    }

    res.status(200).json({
      success: true,
      data: trip,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// =========================
// UPDATE TRAVEL TRIP
// =========================
export const updateTravelTrip = async (req, res) => {
  try {

    const { id } = req.params;

    // Find existing trip
    const existingTrip = await TravelTrip.findById(id);

    if (!existingTrip) {
      return res.status(404).json({
        success: false,
        message: "Travel trip not found"
      });
    }

    // Normalize helper
    const normalizeArray = (field) => {

      if (!field) return [];

      return Array.isArray(field)
        ? field
        : [field];
    };

    // Normalize arrays
    if (req.body.cityIds) {
      req.body.cityIds = normalizeArray(req.body.cityIds);
    }

    if (req.body.vibe) {
      req.body.vibe = normalizeArray(req.body.vibe);
    }

    if (req.body.madeFor) {
      req.body.madeFor = normalizeArray(req.body.madeFor);
    }

    if (req.body.inclusions) {
      req.body.inclusions = normalizeArray(req.body.inclusions);
    }

    // Handle uploaded images
    if (req.files && req.files.length > 0) {

      req.body.images = req.files.map(file =>
        `${req.protocol}://${req.get("host")}/${file.path}`
      );

    } else {

      // Keep old images if no new images uploaded
      req.body.images = existingTrip.images;
    }

    // Update data
    const updatedTrip = await TravelTrip.findByIdAndUpdate(
      id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      message: "Travel trip updated successfully",
      data: updatedTrip
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};


// =========================
// DELETE TRAVEL TRIP
// =========================
export const deleteTravelTrip = async (req, res) => {
  try {

    const { id } = req.params;

    // Find trip
    const trip = await TravelTrip.findById(id);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Travel trip not found"
      });
    }

    // Delete images from uploads folder
    if (trip.images && trip.images.length > 0) {

      trip.images.forEach((imageUrl) => {

        try {

          // Extract relative file path
          const imagePath = imageUrl.replace(
            `${req.protocol}://${req.get("host")}/`,
            ""
          );

          // Absolute path
          const fullPath = path.join(process.cwd(), imagePath);

          // Delete file if exists
          if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
          }

        } catch (err) {
          console.log("Image delete error:", err.message);
        }

      });
    }

    // Delete document
    await TravelTrip.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Travel trip deleted successfully"
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

