import  Country  from "../models/country.model.js";
import  State  from "../models/state.model.js";
import City  from "../models/city.model.js";
import PickAndDropPointByCity from "../models/pickAndDropPointByCity.js";



//  Add Country
export const addCountry = async (req, res) => {
  try {
    const { name, code } = req.body;

    if (!name || !code) {
      return res.status(400).json({
        success: false,
        message: "Country name and code are required",
      });
    }

    const existingCountry = await Country.findOne({ $or: [{ name }, { code }] });

    if (existingCountry) {
      return res.status(400).json({
        success: false,
        message: "Country with this name or code already exists",
      });
    }

    const country = await Country.create({ name, code,countryId:await Country.countDocuments()+1 });

    res.status(201).json({
      success: true,
      message: "Country added successfully",
      country,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}
export const getAllCountries = async (req, res) => {
  try {
    const countries = await Country.find().sort({ name: 1 }); // Sort by name ascending

    res.status(200).json({
      success: true,
      countries,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}
export const getCountryById = async (req, res) => {
  try {
    const { countryId } = req.params;

    const country = await Country.findOne({ countryId: countryId });

    if (!country) {
      return res.status(404).json({
        success: false,
        message: "Country not found",
      });
    }

    res.status(200).json({
      success: true,
      country,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getStatesByCountryId = async (req, res) => {
  try {
    const country_id = Number(req.params.country_id);

    const states = await State.find({ country_id });

    if (!states.length) {
      return res.status(404).json({
        success: false,
        message: "No states found for this country"
      });
    }

    res.status(200).json({
      success: true,
      states
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getCitiesByStateId = async (req, res) => {
  try {
    const state_id = Number(req.params.state_id);

    if (isNaN(state_id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid state_id"
      });
    }

    const cities = await City.find({ state_id }).sort({ city_name: 1 });

    res.status(200).json({
      success: true,
      count: cities.length,
      cities
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// export const getPincodesByCityId = async (req, res) => {

//   try {
//     const city_id = Number(req.params.city_id);

//     if (isNaN(city_id)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid city_id"
//       });
//     }

//     const pincodes = await Pincode.find({ city_id }).sort({ pincode: 1 });

//     res.status(200).json({
//       success: true,
//       count: pincodes.length,
//       pincodes
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

// controllers/city.controller.js



export const getCityList = async (req, res) => {
  try {
    const { search = "" } = req.query;

    const matchStage = {};

    // Search by city name
    if (search) {
      matchStage.city_name = {
        $regex: search,
        $options: "i"
      };
    }

    const cities = await City.aggregate([
      {
        $match: matchStage
      },
      {
        $lookup: {
          from: "states",
          localField: "state_id",
          foreignField: "state_id",
          as: "state"
        }
      },
      {
        $unwind: {
          path: "$state",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: 1,
        //   city_id: 1,
          city_name: 1,

        //   state_object_id: "$state._id",
        //   state_id: "$state.state_id",
          state_name: "$state.state_name"
        }
      },
      {
        $sort: {
          city_name: 1
        }
      }
    ]);

    return res.status(200).json({
      success: true,
      count: cities.length,
      data: cities
    });
  } catch (error) {
    console.log("Get City List Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
};

// ==========================================
// ADD PICKUP POINT
// ==========================================

export const addPickupPoint = async (req, res) => {
  try {

    const { cityId, name, datetime } = req.body;

    if (!cityId || !name || !datetime) {
      return res.status(400).json({
        success: false,
        message: "cityId, name and datetime are required"
      });
    }

    let record = await PickAndDropPointByCity.findOne({
      city: cityId
    });

    // create document if not exists
    if (!record) {
      record = await PickAndDropPointByCity.create({
        city: cityId,
        pickupPoints: [],
        dropPoints: []
      });
    }

    record.pickupPoints.push({
      name,
      datetime
    });

    await record.save();

    return res.status(201).json({
      success: true,
      message: "Pickup point added successfully",
      data: record
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message
    });

  }
};


// ==========================================
// ADD DROP POINT
// ==========================================

export const addDropPoint = async (req, res) => {
  try {

    const { cityId, name, datetime } = req.body;

    if (!cityId || !name || !datetime) {
      return res.status(400).json({
        success: false,
        message: "cityId, name and datetime are required"
      });
    }

    let record = await PickAndDropPointByCity.findOne({
      city: cityId
    });

    // create document if not exists
    if (!record) {
      record = await PickAndDropPointByCity.create({
        city: cityId,
        pickupPoints: [],
        dropPoints: []
      });
    }

    record.dropPoints.push({
      name,
      datetime
    });

    await record.save();

    return res.status(201).json({
      success: true,
      message: "Drop point added successfully",
      data: record
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message
    });

  }
};


// ==========================================
// GET ALL PICKUP POINTS BY CITY ID
// ==========================================

export const getAllPickupPointByCityId = async (req, res) => {
  try {

    const { cityId } = req.params;

    const record = await PickAndDropPointByCity.findOne({
      city: cityId
    }).populate("city", "city_name city_id");

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "No pickup points found"
      });
    }

    return res.status(200).json({
      success: true,
      city: record.city,
      total: record.pickupPoints.length,
      data: record.pickupPoints
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message
    });

  }
};


// ==========================================
// GET ALL DROP POINTS BY CITY ID
// ==========================================

export const getAllDropPointByCityId = async (req, res) => {
  try {

    const { cityId } = req.params;

    const record = await PickAndDropPointByCity.findOne({
      city: cityId
    }).populate("city", "city_name city_id");

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "No drop points found"
      });
    }

    return res.status(200).json({
      success: true,
      city: record.city,
      total: record.dropPoints.length,
      data: record.dropPoints
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message
    });

  }
};