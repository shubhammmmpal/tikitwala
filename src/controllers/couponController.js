import Coupon from '../models/coupon.model.js';
import Booking from '../models/Booking.model.js';
import BookingHotel from '../models/BookingHotel.model.js';



// ===============================================
// BOOKING MODEL MAP
// ===============================================

const bookingModels = {
  BUS: Booking,
  HOTEL: BookingHotel,

  // FUTURE
  // TRAIN: TrainBooking,
  // FLIGHT: FlightBooking,
  // TRIP: TripBooking,
};

// ===============================================
// USER FIELD MAP
// ===============================================

const userFieldMap = {
  BUS: 'user',
  HOTEL: 'bookedById',

  // FUTURE
  // TRAIN: 'user',
  // FLIGHT: 'user',
  // TRIP: 'user',
};

// ===============================================
// PAYMENT STATUS MAP
// ===============================================

const paymentStatusMap = {
  BUS: 'paid',
  HOTEL: 'PAID',

  // FUTURE
  // TRAIN: 'PAID',
  // FLIGHT: 'PAID',
  // TRIP: 'PAID',
};

export const validateCoupon = async (req, res) => {
  try {
    const { code, amount } = req.body;

    const coupon = await Coupon.findOne({ 
      code: code.toUpperCase(),
      isActive: true,
      expiryDate: { $gt: new Date() }
    });

    if (!coupon) {
      return res.status(400).json({ success: false, message: 'Invalid or expired coupon' });
    }

    if (coupon.totalUsageLimit && coupon.usedCount >= coupon.totalUsageLimit) {
      return res.status(400).json({ success: false, message: 'Coupon usage limit reached' });
    }

    if (coupon.minBookingAmount && amount < coupon.minBookingAmount) {
      return res.status(400).json({ 
        success: false, 
        message: `Minimum booking amount ₹${coupon.minBookingAmount} required` 
      });
    }

    let discount = 0;
    if (coupon.discountType === 'PERCENTAGE') {
      discount = (amount * coupon.discountValue) / 100;
      if (coupon.maxDiscountAmount) discount = Math.min(discount, coupon.maxDiscountAmount);
    } else {
      discount = coupon.discountValue;
    }

    res.status(200).json({
      success: true,
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount: Math.round(discount),
        finalAmount: Math.round(amount - discount)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// export const applyCoupon = async (req, res) => {
  
//   return validateCoupon(req, res);
// };





export const getAllCoupons = async (req, res) => {
  try {

    const {
      search,
      serviceType,
      discountType,
      applicableTo,
      isActive,
      firstTimeUserOnly,
      firstTimeForService,
      expired,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // ================= FILTER OBJECT =================

    let filter = {};

    // Search By Coupon Code
    if (search) {
      filter.code = {
        $regex: search,
        $options: 'i'
      };
    }

    // Filter By Service Type
    if (serviceType && serviceType !== 'ALL') {
      filter.serviceType = serviceType;
    }

    // Filter By Discount Type
    if (discountType) {
      filter.discountType = discountType;
    }

    // Filter By Applicable To
    if (applicableTo) {
      filter.applicableTo = applicableTo;
    }

    // Filter By Active Status
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    // Filter First Time User Coupons
    if (firstTimeUserOnly !== undefined) {
      filter.firstTimeUserOnly =
        firstTimeUserOnly === 'true';
    }

    // Filter First Time Service Coupons
    if (firstTimeForService !== undefined) {
      filter.firstTimeForService =
        firstTimeForService === 'true';
    }

    // Expired / Non Expired Coupons
    if (expired === 'true') {
      filter.expiryDate = {
        $lt: new Date()
      };
    }

    if (expired === 'false') {
      filter.expiryDate = {
        $gte: new Date()
      };
    }

    // ================= PAGINATION =================

    const skip = (Number(page) - 1) * Number(limit);

    // ================= SORTING =================

    const sort = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1
    };

    // ================= QUERY =================

    const coupons = await Coupon.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    const totalCoupons = await Coupon.countDocuments(filter);

    // ================= RESPONSE =================

    return res.status(200).json({
      success: true,
      totalCoupons,
      currentPage: Number(page),
      totalPages: Math.ceil(totalCoupons / limit),
      coupons
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message
    });

  }
};


// ================= CREATE COUPON =================

export const createCoupon = async (req, res) => {
  try {
    const {
      code,
      serviceType,
      applicableEntityIds,
      entityModel,
      discountType,
      discountValue,
      minBookingAmount,
      maxDiscountAmount,
      expiryDate,
      isActive,
      applicableTo,
      firstTimeUserOnly,
      firstTimeForService,
      totalUsageLimit,
      perUserLimit,
      startDate,
      description
    } = req.body;

    // Check Existing Coupon
    const existingCoupon = await Coupon.findOne({
      code: code.toUpperCase()
    });

    if (existingCoupon) {
      return res.status(400).json({
        success: false,
        message: 'Coupon code already exists'
      });
    }

    // Create Coupon
    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      serviceType,
      applicableEntityIds,
      entityModel,
      discountType,
      discountValue,
      minBookingAmount,
      maxDiscountAmount,
      expiryDate,
      isActive,
      applicableTo,
      firstTimeUserOnly,
      firstTimeForService,
      totalUsageLimit,
      perUserLimit,
      startDate,
      description
    });

    return res.status(201).json({
      success: true,
      message: 'Coupon created successfully',
      data: coupon
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// ================= UPDATE COUPON =================

export const updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;

    const coupon = await Coupon.findById(id);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }

    // If code is updating then check uniqueness
    if (req.body.code) {

      const existingCoupon = await Coupon.findOne({
        code: req.body.code.toUpperCase(),
        _id: { $ne: id }
      });

      if (existingCoupon) {
        return res.status(400).json({
          success: false,
          message: 'Coupon code already exists'
        });
      }

      req.body.code = req.body.code.toUpperCase();
    }

    const updatedCoupon = await Coupon.findByIdAndUpdate(
      id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    return res.status(200).json({
      success: true,
      message: 'Coupon updated successfully',
      data: updatedCoupon
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// ================= GET COUPON BY ID =================

export const getCouponById = async (req, res) => {
  try {

    const { id } = req.params;

    const coupon = await Coupon.findById(id);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: coupon
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// ================= DELETE COUPON =================

export const deleteCoupon = async (req, res) => {
  try {

    const { id } = req.params;

    const coupon = await Coupon.findById(id);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }

    await Coupon.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Coupon deleted successfully'
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// ===============================================
// APPLY COUPON API
// ===============================================

export const applyCoupon = async (req, res) => {
  try {

    const {
      code,
      userId,
      bookingAmount,
      serviceType,
      entityId
    } = req.body;

    // ===============================================
    // BASIC VALIDATION
    // ===============================================

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Coupon code is required'
      });
    }

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User id is required'
      });
    }

    if (!bookingAmount) {
      return res.status(400).json({
        success: false,
        message: 'Booking amount is required'
      });
    }

    if (!serviceType) {
      return res.status(400).json({
        success: false,
        message: 'Service type is required'
      });
    }

    // ===============================================
    // FIND BOOKING MODEL
    // ===============================================

    const BookingModel = bookingModels[serviceType];

    if (!BookingModel) {
      return res.status(400).json({
        success: false,
        message: 'Invalid service type'
      });
    }

    // ===============================================
    // FIND USER FIELD
    // ===============================================

    const userField = userFieldMap[serviceType];

    // ===============================================
    // PAYMENT STATUS
    // ===============================================

    const paidStatus = paymentStatusMap[serviceType];

    // ===============================================
    // FIND COUPON
    // ===============================================

    const coupon = await Coupon.findOne({
      code: code.toUpperCase().trim()
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Invalid coupon code'
      });
    }

    // ===============================================
    // ACTIVE CHECK
    // ===============================================

    if (!coupon.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Coupon is inactive'
      });
    }

    // ===============================================
    // START DATE CHECK
    // ===============================================

    if (
      coupon.startDate &&
      new Date() < new Date(coupon.startDate)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Coupon is not started yet'
      });
    }

    // ===============================================
    // EXPIRY CHECK
    // ===============================================

    if (
      new Date() > new Date(coupon.expiryDate)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Coupon expired'
      });
    }

    // ===============================================
    // SERVICE TYPE CHECK
    // ===============================================

    if (
      coupon.serviceType !== 'ALL' &&
      coupon.serviceType !== serviceType
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Coupon not applicable for this service'
      });
    }

    // ===============================================
    // ENTITY VALIDATION
    // ===============================================

    if (
      coupon.applicableEntityIds &&
      coupon.applicableEntityIds.length > 0
    ) {

      const isApplicable =
        coupon.applicableEntityIds
          .map(id => id.toString())
          .includes(entityId);

      if (!isApplicable) {
        return res.status(400).json({
          success: false,
          message:
            'Coupon not applicable for this item'
        });
      }
    }

    // ===============================================
    // MIN BOOKING AMOUNT
    // ===============================================

    if (
      bookingAmount <
      coupon.minBookingAmount
    ) {
      return res.status(400).json({
        success: false,
        message:
          `Minimum booking amount should be ${coupon.minBookingAmount}`
      });
    }

    // ===============================================
    // TOTAL USAGE LIMIT
    // ===============================================

    if (
      coupon.totalUsageLimit !== null &&
      coupon.usedCount >= coupon.totalUsageLimit
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Coupon usage limit exceeded'
      });
    }

    // ===============================================
    // PER USER LIMIT
    // ===============================================

    const userCouponUsage =
      await BookingModel.countDocuments({
        [userField]: userId,
        appliedCoupon: coupon._id
      });

    if (
      userCouponUsage >=
      coupon.perUserLimit
    ) {
      return res.status(400).json({
        success: false,
        message:
          'You already used this coupon maximum times'
      });
    }

    // ===============================================
    // FIRST TIME USER CHECK
    // ===============================================

    if (coupon.firstTimeUserOnly) {

      const [
        busBooking,
        hotelBooking
      ] = await Promise.all([

        Booking.findOne({
          user: userId,
          paymentStatus: 'paid'
        }),

        BookingHotel.findOne({
          bookedById: userId,
          paymentStatus: 'PAID'
        })

      ]);

      if (
        busBooking ||
        hotelBooking
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Coupon valid only for first time users'
        });
      }
    }

    // ===============================================
    // FIRST TIME SERVICE CHECK
    // ===============================================

    if (coupon.firstTimeForService) {

      const existingServiceBooking =
        await BookingModel.findOne({
          [userField]: userId,
          paymentStatus: paidStatus
        });

      if (existingServiceBooking) {
        return res.status(400).json({
          success: false,
          message:
            `Coupon valid only for first ${serviceType} booking`
        });
      }
    }

    // ===============================================
    // DISCOUNT CALCULATION
    // ===============================================

    let discountAmount = 0;

    // Percentage
    if (
      coupon.discountType === 'PERCENTAGE'
    ) {

      discountAmount =
        (bookingAmount *
          coupon.discountValue) / 100;

      // Max Discount Cap
      if (
        coupon.maxDiscountAmount &&
        discountAmount >
        coupon.maxDiscountAmount
      ) {
        discountAmount =
          coupon.maxDiscountAmount;
      }
    }

    // Fixed Amount
    if (
      coupon.discountType ===
      'FIXED_AMOUNT'
    ) {
      discountAmount =
        coupon.discountValue;
    }

    // Prevent negative amount
    if (
      discountAmount > bookingAmount
    ) {
      discountAmount = bookingAmount;
    }

    // ===============================================
    // FINAL AMOUNT
    // ===============================================

    const finalAmount =
      bookingAmount - discountAmount;

    await Coupon.findByIdAndUpdate(
      coupon._id,
      {
        $inc: {
          usedCount: 1
        }
      }
    );

    // ===============================================
    // RESPONSE
    // ===============================================

    return res.status(200).json({
      success: true,
      message:
        'Coupon applied successfully',

      data: {
        couponId: coupon._id,
        couponCode: coupon.code,
        serviceType,

        originalAmount:
          bookingAmount,

        discountType:
          coupon.discountType,

        discountValue:
          coupon.discountValue,

        discountAmount,

        finalAmount,

        savings:
          discountAmount
      }
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message
    });

  }
};