import Camp from "../models/camp.model.js";
import Volunteer from "../models/volunteer.model.js";
import bcrypt from "bcryptjs";

export const createVolunteer = async (req, res) => {
  try {
    const { campId, name, phone, email, role,agent_id, password,age,batchNo } = req.body;

    const camp = await Camp.findById(campId);

    if (!camp) {
      return res.status(404).json({
        success: false,
        message: "Camp not found",
      });
    }

    const existingVolunteer = await Volunteer.findOne({
      $or: [{ email }, { phone }],
    });

    if (existingVolunteer) {
      return res.status(400).json({
        success: false,
        message: "Volunteer already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const volunteer = await Volunteer.create({
      campId,
      name,
      phone,
      email,
      role,
      age,
      batchNo,
      agent_id,
      password: hashedPassword,
      image: req.file?.path || "",
      createdBy: req.user.id,
    });

    return res.status(201).json({
      success: true,
      message: "Volunteer added successfully",
      data: volunteer,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// export const getVolunteersByCamp = async (req, res) => {
//   try {
//     const volunteers = await Volunteer.find({
//       campId: req.params.campId,
//     });

//     return res.status(200).json({
//       success: true,
//       count: volunteers.length,
//       data: volunteers,
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };


export const getCampById = async (req, res) => {
  try {
    const camp = await Camp.findById(req.params.id);

    if (!camp) {
      return res.status(404).json({
        success: false,
        message: "Camp not found",
      });
    }

    const volunteers = await Volunteer.find({
      campId: camp._id,
    });

    return res.status(200).json({
      success: true,
      data: {
        ...camp.toObject(),
        volunteers,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


export const updateVolunteer = async (req, res) => {
  try {
    const { id } = req.params;
  //   console.log(req.body)
  //  return
    const {
      campId,
      name,
      phone,
      email,
      role,
      password,
      age,
      batchNo,
    } = req.body;

    const volunteer = await Volunteer.findById(id);

    if (!volunteer) {
      return res.status(404).json({
        success: false,
        message: "Volunteer not found",
      });
    }

    if (campId) {
      const camp = await Camp.findById(campId);

      if (!camp) {
        return res.status(404).json({
          success: false,
          message: "Camp not found",
        });
      }

      volunteer.campId = campId;
    }

    if (email || phone) {
      const existingVolunteer = await Volunteer.findOne({
        _id: { $ne: id },
        $or: [
          ...(email ? [{ email }] : []),
          ...(phone ? [{ phone }] : []),
        ],
      });

      if (existingVolunteer) {
        return res.status(400).json({
          success: false,
          message: "Email or phone already exists",
        });
      }
    }

    volunteer.name = name || volunteer.name;
    volunteer.phone = phone || volunteer.phone;
    volunteer.email = email || volunteer.email;
    volunteer.role = role || volunteer.role;
    volunteer.age = age || volunteer.age;
    volunteer.batchNo = batchNo || volunteer.batchNo;

    if (password) {
      volunteer.password = await bcrypt.hash(password, 10);
    }

    if (req.file) {
      volunteer.image = req.file.path;
    }

    await volunteer.save();

    return res.status(200).json({
      success: true,
      message: "Volunteer updated successfully",
      data: volunteer,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getVolunteersByCamp = async (req, res) => {
  try {
    const { campId } = req.params;

    const volunteers = await Volunteer.find({ campId })
      .populate("campId")
      .populate("createdBy", "name email");

    return res.status(200).json({
      success: true,
      count: volunteers.length,
      data: volunteers,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


export const getVolunteerById = async (req, res) => {
  try {
    const { id } = req.params;

    const volunteer = await Volunteer.findById(id)
      .populate("campId")
      .populate("createdBy", "name email");

    if (!volunteer) {
      return res.status(404).json({
        success: false,
        message: "Volunteer not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: volunteer,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteVolunteer = async (req, res) => {
  try {
    const { id } = req.params;

    const volunteer = await Volunteer.findById(id);

    if (!volunteer) {
      return res.status(404).json({
        success: false,
        message: "Volunteer not found",
      });
    }

    await Volunteer.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Volunteer deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};