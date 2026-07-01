import Hotel from '../models/hotel.model.js';
import Room from '../models/room.model.js';
import RoomAvailability from '../models/RoomAvailability.model.js';
import InventoryHotel from '../models/inventoryHotel.model.js '
import mongoose from 'mongoose';

// ====================== PUBLIC APIS ======================

export const searchHotels = async (req, res) => {
  try {
    const {
      city,
      roomType,
      guests = 2,
      page = 1,
      limit = 10,
    } = req.query;

    // Hotel filters
    const hotelQuery = {
      status: "ACTIVE",
    };

    // City filter
    if (city) {
      hotelQuery["address.city"] = {
        $regex: city,
        $options: "i",
      };
    }

    // Room filters
    const roomQuery = {
      status: "ACTIVE",
    };

    // Room type filter
    if (roomType) {
      roomQuery.roomType = roomType.toUpperCase();
    }

    const hotels = await Hotel.aggregate([
      {
        $match: hotelQuery,
      },

      // Get rooms
      {
        $lookup: {
          from: "rooms",
          localField: "_id",
          foreignField: "hotel",
          as: "rooms",
          pipeline: [
            {
              $match: roomQuery,
            },

            // Optional guest capacity filter
            {
              $match: {
                maxOccupancy: { $gte: Number(guests) },
              },
            },

            {
              $project: {
                roomType: 1,
                name: 1,
                description: 1,
                basePricePerNight: 1,
                discountPricePerNight: 1,
                withBreakfastPricePerNight: 1,
                taxesAndFees: 1,
                capacity: 1,
                maxOccupancy: 1,
                amenities: 1,
                images: 1,
                totalInventory: 1,
              },
            },
          ],
        },
      },

      // Remove hotels with no matching rooms
      {
        $match: {
          rooms: { $ne: [] },
        },
      },

      // Sort hotels
      {
        $sort: {
          "ratings.average": -1,
        },
      },

      // Pagination
      {
        $skip: (Number(page) - 1) * Number(limit),
      },

      {
        $limit: Number(limit),
      },
    ]);

    const total = await Hotel.countDocuments(hotelQuery);

    res.status(200).json({
      success: true,
      count: hotels.length,
      total,
      totalPages: Math.ceil(total / limit),
      hotels,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const nearbyHotels = async (req, res) => {
  try {
    const { lat, lng, radius = 10 } = req.query; // radius in kilometers

    if (!lat || !lng) {
      return res.status(400).json({ success: false, message: 'lat and lng are required' });
    }

    const hotels = await Hotel.find({
      status: 'ACTIVE',
      geoLocation: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: radius * 1000 // convert km to meters
        }
      }
    }).select('name address geoLocation images averageRating reviewCount');

    res.status(200).json({ success: true, count: hotels.length, hotels });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getHotelById = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id)
      // .populate({
      //   path: 'rooms',           // We'll add virtual or separate route for rooms
      //   select: 'roomType name basePricePerNight capacity maxOccupancy status'
      // });

    if (!hotel) {
      return res.status(404).json({ success: false, message: 'Hotel not found' });
    }

    res.status(200).json({ success: true, hotel });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getHotelRooms = async (req, res) => {
  try {
    const rooms = await Room.find({ 
      hotel: req.params.id,
      status: 'ACTIVE'
    }).select('-__v');

    res.status(200).json({ success: true, count: rooms.length, rooms });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ====================== ADMIN ONLY APIS ======================

export const createHotel = async (req, res) => {
  try {
    console.log(req)

    const adminId = req.user.id

    const coverImageIndex = Number(req.body.coverImageIndex || 0);


    const imageData = req.files?.map((file, index) => ({
      url: file.path,
      caption: req.body?.captions?.[index] || "",
      isCover: index === 0
    })) || [];
    

    const hotel = await Hotel.create({
      name: req.body.name,
      description: req.body.description,
      checkInTime: req.body.checkInTime,
      checkOutTime: req.body.checkOutTime,

      address: {
        street: req.body.street,
        city: req.body.city,
        state: req.body.state,
        country: req.body.country,
        pincode: req.body.pincode,
      },

      latitude: req.body.latitude,
      longitude: req.body.longitude,

      amenities: req.body.amenities
        ? JSON.parse(req.body.amenities)
        : [],

      important_facts: req.body.important_facts
        ? JSON.parse(req.body.important_facts)
        : [],

      property_Rules: req.body.property_Rules
        ? JSON.parse(req.body.property_Rules)
        : [],

      policies: req.body.policies
        ? JSON.parse(req.body.policies)
        : [],

      images: imageData,

      status: req.body.status,
      cancellationPolicy: req.body.cancellationPolicy,

      contact: {
        email: req.body.email,
        phone: req.body.phone,
      },

      dynamicPricingFactor:
        req.body.dynamicPricingFactor || 1,
      
      createdby:adminId,
    });

    // Create Inventory for this hotel
    await InventoryHotel.create({
      createdBy: adminId,
      hotelId: hotel._id,
      inventory: [],
    });

    return res.status(201).json({
      success: true,
      data: hotel,
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

export const updateHotel = async (req, res) => {
  try {

    const updateData = {
      ...req.body
    };

    if (req.files && req.files.length > 0) {
      updateData.images = req.files.map((file, index) => ({
        url: file.path,
        caption: "",
        isCover: index === Number(req.body.coverImageIndex || 0)
      }));
    }

    const hotel = await Hotel.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    );

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "Hotel not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Hotel updated successfully",
      hotel
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

export const deleteHotel = async (req, res) => {
   
  try {
    const hotel = await Hotel.findById(req.params.id);
   
    if (!hotel) {
      return res.status(404).json({ success: false, message: 'Hotel not found' });
    }

    hotel.status = 'INACTIVE'; // Soft delete
    await hotel.save();

    res.status(200).json({ success: true, message: 'Hotel deactivated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateHotelStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const hotel = await Hotel.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!hotel) {
      return res.status(404).json({ success: false, message: 'Hotel not found' });
    }

    res.status(200).json({
      success: true,
      message: `Hotel status updated to ${status}`,
      hotel
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Advanced Search - Add this function
export const advancedHotelSearch = async (req, res) => {
  try {
    const {
      city,
      checkInDate,
      checkOutDate,
      rooms = 1,
      adults = 2,
      children = 0,
      page = 1,
      limit = 10,
      minPrice,
      maxPrice,
      rating
    } = req.body || req.query;

    if (!city || !checkInDate || !checkOutDate) {
      return res.status(400).json({
        success: false,
        message: "city, checkInDate, and checkOutDate are required"
      });
    }

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));

    if (nights <= 0) {
      return res.status(400).json({ success: false, message: "Check-out date must be after check-in date" });
    }

    // Step 1: Find Active Hotels in the city
    const hotelQuery = {
      'address.city': { $regex: city, $options: 'i' },
      status: 'ACTIVE'
    };

    if (rating) hotelQuery.averageRating = { $gte: Number(rating) };

    let hotels = await Hotel.find(hotelQuery)
      .select('name address geoLocation images averageRating reviewCount amenities cancellationPolicy couponCodes')
      .sort({ averageRating: -1 });

    const result = [];

    console.log(hotels.length)
    // console.log(hotels)
    // Step 2: For each hotel, check room availability
    for (const hotel of hotels) {
      const availableRooms = await Room.find({
        hotel: hotel._id,
        status: 'ACTIVE',
        'capacity.adults': { $gte: Math.ceil(adults / rooms) },   // rough distribution
        maxOccupancy: { $gte: Math.ceil((adults + children) / rooms) }
      });
    console.log(availableRooms)

      if (availableRooms.length === 0) continue;

      let hotelTotalAvailable = 0;
      let cheapestRoom = null;
      let totalPriceForStay = Infinity;

      for (const room of availableRooms) {
        // Check availability for all dates
        const dates = [];
        let current = new Date(checkIn);
        while (current < checkOut) {
          dates.push(new Date(current));
          current.setDate(current.getDate() + 1);
        }

        const availabilities = await RoomAvailability.find({
          room: room._id,
          date: { $in: dates }
        });

    let isFullyAvailable = false;

if (availabilities.length === 0) {
  // ✅ No availability data → assume full inventory available
  isFullyAvailable = room.totalInventory >= rooms;
} else {
  // ✅ Check all dates
  isFullyAvailable = dates.every(date => {
    const record = availabilities.find(a => 
      a.date.toISOString().split('T')[0] === date.toISOString().split('T')[0]
    );

    if (!record) {
      // No record for this date → assume full availability
      return room.totalInventory >= rooms;
    }

    return (record.availableCount - record.heldCount) >= rooms;
  });
}

        if (isFullyAvailable) {
          const pricePerNight = room.basePricePerNight;
          const totalForThisRoom = pricePerNight * nights * rooms;

if (availabilities.length === 0) {
  hotelTotalAvailable += room.totalInventory;
} else {
  hotelTotalAvailable += (availabilities[0]?.availableCount || 0);
}
          if (totalForThisRoom < totalPriceForStay) {
            totalPriceForStay = totalForThisRoom;
            cheapestRoom = {
              roomId: room._id,
              roomName: room.name,
              roomType: room.roomType,
              pricePerNight,
              totalPrice: totalForThisRoom
            };
          }
        }
      }

      if (cheapestRoom) {
        result.push({
          hotel: {
            id: hotel._id,
            name: hotel.name,
            address: hotel.address,
            images: hotel.images,
            averageRating: hotel.averageRating,
            reviewCount: hotel.reviewCount,
            amenities: hotel.amenities
          },
          availableRoomsCount: hotelTotalAvailable,
          cheapestRoom,
          totalPriceForStay: cheapestRoom.totalPrice,
          nights
        });
      }
    }

    // Apply price filter if provided
    let filteredResult = result;
    if (minPrice || maxPrice) {
      filteredResult = result.filter(item => {
        const price = item.totalPriceForStay;
        return (!minPrice || price >= minPrice) && (!maxPrice || price <= maxPrice);
      });
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const paginatedResult = filteredResult.slice(startIndex, startIndex + Number(limit));

    res.status(200).json({
      success: true,
      totalHotels: filteredResult.length,
      totalPages: Math.ceil(filteredResult.length / limit),
      currentPage: Number(page),
      checkIn: checkInDate,
      checkOut: checkOutDate,
      nights,
      searchParams: { rooms, adults, children },
      hotels: paginatedResult
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyHotelInventories = async (req, res) => {
  try {
    const userId = req.user.id;

    const inventories = await InventoryHotel.find({
      createdBy: userId,
    })
      .populate({
        path: "hotelId",
        select:
          "name address.city address.state address.country status images",
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: inventories.length,
      data: inventories,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllHotelsAdmin = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      startDate,
      endDate,
    } = req.query;

    const currentPage = Number(page);
    const pageSize = Number(limit);
    const skip = (currentPage - 1) * pageSize;

    // ----------------------------
    // Build Filter
    // ----------------------------

    const filter = {};

    // Search
    if (search) {
      filter.$or = [
        {
          name: {
            $regex: search,
            $options: "i",
          },
        },
        {
          "address.street": {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    // Status
    if (status && status !== "ALL") {
      filter.status = status;
    }

    // Date Filter
    if (startDate || endDate) {
      filter.createdAt = {};

      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }

      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        filter.createdAt.$lte = end;
      }
    }

    // Today's count
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalHotels,
      activeHotels,
      inactiveHotels,
      todayHotels,
      hotelResult,
    ] = await Promise.all([
      Hotel.countDocuments(),

      Hotel.countDocuments({
        status: "ACTIVE",
      }),

      Hotel.countDocuments({
        status: "INACTIVE",
      }),

      Hotel.countDocuments({
        createdAt: {
          $gte: today,
        },
      }),

      Hotel.aggregate([
        {
          $match: filter,
        },

        {
          $lookup: {
            from: "rooms",
            localField: "_id",
            foreignField: "hotel",
            as: "rooms",
          },
        },

        {
          $lookup: {
            from: "inventoryhotels",
            localField: "_id",
            foreignField: "hotelId",
            as: "inventory",
          },
        },
        {
  $lookup: {
    from: "cities",
    localField: "address.city",
    foreignField: "_id",
    as: "city"
  }
},
{
  $lookup: {
    from: "states",
    localField: "address.state",
    foreignField: "_id",
    as: "state"
  }
},
{
  $addFields: {
    "address.city": { $arrayElemAt: ["$city", 0] },
    "address.state": { $arrayElemAt: ["$state", 0] }
  }
},

        {
          $project: {
            name: 1,
            description: 1,
            status: 1,
            address: 1,
            ratings: 1,
            createdAt: 1,

            roomCount: {
              $size: "$rooms",
            },

            inventory: {
              $cond: [
                {
                  $gt: [
                    {
                      $size: "$inventory",
                    },
                    0,
                  ],
                },
                {
                  $map: {
                    input: {
                      $arrayElemAt: [
                        "$inventory.inventory",
                        0,
                      ],
                    },
                    as: "item",
                    in: {
                      roomType: "$$item.roomType",
                      totalCount: "$$item.totalCount",
                      bookedCount: "$$item.bookedCount",
                      available: {
                        $subtract: [
                          "$$item.totalCount",
                          "$$item.bookedCount",
                        ],
                      },
                      basePrice: "$$item.basePrice",
                      dealPrice: "$$item.dealPrice",
                    },
                  },
                },
                [],
              ],
            },
          },
        },

        {
          $sort: {
            createdAt: -1,
          },
        },

        {
          $facet: {
            data: [
              {
                $skip: skip,
              },
              {
                $limit: pageSize,
              },
            ],

            total: [
              {
                $count: "count",
              },
            ],
          },
        },
      ]),
    ]);

    const hotels = hotelResult[0].data;
    const totalFiltered = hotelResult[0].total[0]?.count || 0;

    return res.status(200).json({
      success: true,

      counts: {
        totalHotels,
        activeHotels,
        inactiveHotels,
        todayHotels,
      },

      pagination: {
        page: currentPage,
        limit: pageSize,
        totalRecords: totalFiltered,
        totalPages: Math.ceil(totalFiltered / pageSize),
      },

      hotels,
    });
  } catch (err) {
    console.log(err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const getHotelDetailsAdmin = async (req, res) => {
  try {
    const { hotelId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(hotelId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Hotel Id"
      });
    }

    const hotel = await Hotel.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(hotelId)
        }
      },

      {
        $lookup: {
          from: "cities",
          localField: "address.city",
          foreignField: "_id",
          as: "city"
        }
      },

      {
        $lookup: {
          from: "states",
          localField: "address.state",
          foreignField: "_id",
          as: "state"
        }
      },

      {
        $lookup: {
          from: "rooms",
          localField: "_id",
          foreignField: "hotel",
          as: "rooms"
        }
      },

      {
        $lookup: {
          from: "inventoryhotels",
          localField: "_id",
          foreignField: "hotelId",
          as: "inventory"
        }
      },

      {
        $addFields: {
          city: {
            $arrayElemAt: ["$city", 0]
          },
          state: {
            $arrayElemAt: ["$state", 0]
          },
          inventory: {
            $arrayElemAt: ["$inventory", 0]
          }
        }
      }
    ]);

    if (!hotel.length) {
      return res.status(404).json({
        success: false,
        message: "Hotel not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: hotel[0]
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};
