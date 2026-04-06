import Agency from "../models/Agency.model.js";

/**
 * @desc    Create a new Travel Agency
 * @route   POST /api/agencies
 * @access  Admin
 */
export const createAgency = async (req, res) => {
  try {
    const {
      name,
      shortName,
      description,
      email,
      phone,
      secondaryPhone,
      website,
      address,
      gstNumber,
      panNumber,
      registrationNumber,
      logo,
      rating,
      operatingRoutes
    } = req.body;

    // Check if agency with same name or email already exists
    const existingAgency = await Agency.findOne({
      $or: [{ name }, { email }]
    });

    if (existingAgency) {
      if (existingAgency.name === name) {
        return res.status(400).json({
          success: false,
          message: 'An agency with this name already exists'
        });
      }
      if (existingAgency.email === email) {
        return res.status(400).json({
          success: false,
          message: 'An agency with this email already exists'
        });
      }
    }

    const agency = await Agency.create({
      name,
      shortName,
      description,
      email,
      phone,
      secondaryPhone,
      website,
      address,
      gstNumber,
      panNumber,
      registrationNumber,
      logo,
      rating,
      operatingRoutes
    });

    return res.status(201).json({
      success: true,
      message: 'Agency created successfully',
      data: agency
    });
  } catch (error) {
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: messages
      });
    }

    // Handle duplicate key error (MongoDB error code 11000)
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({
        success: false,
        message: `Duplicate value for field: ${field}. This ${field} is already registered.`
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to create agency',
      error: error.message
    });
  }
};

/**
 * @desc    Edit an existing Travel Agency
 * @route   PUT /api/agencies/:id
 * @access  Admin
 */
export const editAgency = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Don't allow updating _id, createdAt
    delete updateData._id;
    delete updateData.createdAt;

    // Check if agency exists
    const agency = await Agency.findById(id);
    if (!agency) {
      return res.status(404).json({
        success: false,
        message: 'Agency not found'
      });
    }

    // If name or email is being updated, check for duplicates
    if (updateData.name || updateData.email) {
      const duplicateQuery = { _id: { $ne: id } };
      if (updateData.name) duplicateQuery.name = updateData.name;
      if (updateData.email) duplicateQuery.email = updateData.email;

      const duplicateAgency = await Agency.findOne(duplicateQuery);
      if (duplicateAgency) {
        if (duplicateAgency.name === updateData.name) {
          return res.status(400).json({
            success: false,
            message: 'An agency with this name already exists'
          });
        }
        if (duplicateAgency.email === updateData.email) {
          return res.status(400).json({
            success: false,
            message: 'An agency with this email already exists'
          });
        }
      }
    }

    // Update the agency
    const updatedAgency = await Agency.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,        // Return the updated document
        runValidators: true // Run schema validators on update
      }
    );

    return res.status(200).json({
      success: true,
      message: 'Agency updated successfully',
      data: updatedAgency
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: messages
      });
    }

    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: 'Invalid agency ID format'
      });
    }

    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({
        success: false,
        message: `Duplicate value for field: ${field}. This ${field} is already registered.`
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to update agency',
      error: error.message
    });
  }
};

/**
 * @desc    Delete a Travel Agency
 * @route   DELETE /api/agencies/:id
 * @access  Admin
 */
export const deleteAgency = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if agency exists
    const agency = await Agency.findById(id);
    if (!agency) {
      return res.status(404).json({
        success: false,
        message: 'Agency not found'
      });
    }

    // Delete the agency
    await Agency.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Agency deleted successfully',
      data: { _id: id }
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: 'Invalid agency ID format'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to delete agency',
      error: error.message
    });
  }
};

/**
 * @desc    Get paginated list of Travel Agencies with filters & search
 * @route   GET /api/agencies
 * @access  Admin
 *
 * @query   page         - Page number (default: 1)
 * @query   limit        - Items per page (default: 10)
 * @query   search       - Search by name, email, phone
 * @query   city         - Filter by city
 * @query   state        - Filter by state
 * @query   isActive     - Filter by status (true/false)
 * @query   sortBy       - Sort field (name, rating, createdAt, etc.)
 * @query   sortOrder    - Sort order (asc/desc)
 */
export const getAgencyList = async (req, res) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};

    // Search filter (name, email, phone)
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      filter.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { shortName: searchRegex }
      ];
    }

    // City filter
    if (req.query.city) {
      filter['address.city'] = { $regex: new RegExp(req.query.city, 'i') };
    }

    // State filter
    if (req.query.state) {
      filter['address.state'] = { $regex: new RegExp(req.query.state, 'i') };
    }

    // Active status filter
    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === 'true';
    }

    // Sort
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const sort = { [sortBy]: sortOrder };

    // Execute queries in parallel
    const [agencies, totalCount] = await Promise.all([
      Agency.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .select('-__v'), // Exclude __v field
      Agency.countDocuments(filter)
    ]);

    // Response metadata
    const totalPages = Math.ceil(totalCount / limit);

    return res.status(200).json({
      success: true,
      message: 'Agencies fetched successfully',
      data: agencies,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch agencies',
      error: error.message
    });
  }
};

/**
 * @desc    Get a single Travel Agency by ID
 * @route   GET /api/agencies/:id
 * @access  Admin
 */
export const getAgencyById = async (req, res) => {
  try {
    const { id } = req.params;

    const agency = await Agency.findById(id).select('-__v');

    if (!agency) {
      return res.status(404).json({
        success: false,
        message: 'Agency not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Agency fetched successfully',
      data: agency
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: 'Invalid agency ID format'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch agency',
      error: error.message
    });
  }
};

/**
 * @desc    Change Agency active/inactive status
 * @route   PATCH /api/agencies/:id/status
 * @access  Admin
 *
 * @body    isActive - Boolean (true to activate, false to deactivate)
 */
export const changeAgencyStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    // Validate isActive field
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive must be a boolean value (true or false)'
      });
    }

    // Check if agency exists
    const agency = await Agency.findById(id);
    if (!agency) {
      return res.status(404).json({
        success: false,
        message: 'Agency not found'
      });
    }

    // Check if status is already the same
    if (agency.isActive === isActive) {
      return res.status(400).json({
        success: false,
        message: `Agency is already ${isActive ? 'active' : 'inactive'}`
      });
    }

    // Update status
    agency.isActive = isActive;
    await agency.save();

    return res.status(200).json({
      success: true,
      message: `Agency ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        _id: agency._id,
        name: agency.name,
        isActive: agency.isActive
      }
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: 'Invalid agency ID format'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to change agency status',
      error: error.message
    });
  }
};