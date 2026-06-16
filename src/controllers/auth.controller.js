import User from "../models/User.model.js";
import generateToken from "../utils/generateToken.js";
import { OAuth2Client } from "google-auth-library";
import { getIO } from "../socket/socket.js";
import Camp from "../models/camp.model.js";
import { getNearbyActiveUsers } from "./camp.controller.js";
import { getDistanceInKm } from "../utils/helper.js";
import Volunteer from "../models/volunteer.model.js";
import bcrypt from "bcryptjs";

export const calculateNearbyUsersCount = async (agentId) => {
  const camps = await Camp.find({
    createdBy: agentId,
  });

  if (!camps.length) {
    return 0;
  }

  const users = await User.find({
    role: "user",
    "activeLocation.latitude": { $exists: true },
    "activeLocation.longitude": { $exists: true },
  }).select("activeLocation");

  const uniqueUsers = new Set();

  for (const camp of camps) {
    for (const user of users) {
      const distance = getDistanceInKm(
        camp.latitude,
        camp.longitude,
        user.activeLocation.latitude,
        user.activeLocation.longitude,
      );

      if (distance <= 5) {
        uniqueUsers.add(user._id.toString());
      }
    }
  }

  return uniqueUsers.size;
};

export const updateActiveLocation = async (req, res) => {
  try {
    const userId = req.body.id;
    const { latitude, longitude } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        activeLocation: {
          latitude,
          longitude,
          updatedAt: new Date(),
        },
      },
      { new: true },
    );

    const io = getIO();

    // Get all agents
    const agents = await User.find({
      role: "agent",
    }).select("_id");

    for (const agent of agents) {
      const totalUsers = await calculateNearbyUsersCount(agent._id);

      io.to("all-camps").emit("active-user-count", {
        agentId: agent._id,
        totalUsers,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Location updated successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const signup = async (req, res) => {
  try {
    const { name, email, phone, role, password, device, agent_id } = req.body;

    if (!agent_id) {
      return res.status(401).json({
        success: false,
        message: "agent_id is required",
      });
    }

    if (!/^T[A-Z]\d{8}$/i.test(agent_id)) {
      return res.status(400).json({
        success: false,
        message: "agent_id must be in format TX12345678",
      });
    }

    // Check existing user
    const userExists = await User.findOne({
      $or: [
        ...(email ? [{ email }] : []),
        { phone },
        ...(agent_id ? [{ agent_id }] : []),
      ],
    });

    if (userExists) {
      let message = "User already exists";

      if (agent_id && userExists.agent_id === agent_id) {
        message = "Agent ID already exists";
      } else if (email && userExists.email === email) {
        message = "Email already exists";
      } else if (userExists.phone === phone) {
        message = "Phone number already exists";
      }

      return res.status(400).json({
        success: false,
        message,
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      phone,
      role: role || "user",
      password,
      agent_id,
      devices: device ? [device] : [],
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        agent_id: user.agent_id,
        role: user.role,
        token: generateToken(user),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
// import User from '../models/User.js';
// import generateToken from '../utils/generateToken.js';

export const signin = async (req, res) => {
  try {
    const { agent_id, password, device, email } = req.body;

    // const agent_id = agent_id;

    // =========================
    // Try User Login
    // =========================
    const user = await User.findOne({ agent_id }).select("+password");
    console.log(user);

    if (user) {
      const isMatch = await user.matchPassword(password);

      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
      }

      if (device) {
        const existingDevice = user.devices.find(
          (d) => d.deviceId === device.deviceId,
        );

        if (!existingDevice) {
          user.devices.push(device);
        } else {
          existingDevice.lastLogin = new Date();
        }

        await user.save();
      }

      return res.status(200).json({
        success: true,
        message: "Login successful",
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          token: generateToken(user),
        },
      });
    }

    // =========================
    // Try Volunteer Login
    // =========================
    const volunteer = await Volunteer.findOne({ email });

    console.log(volunteer);

    if (!volunteer) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isMatch = await bcrypt.compare(password, volunteer.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        _id: volunteer._id,
        name: volunteer.name,
        email: volunteer.email,
        phone: volunteer.phone,
        role: volunteer.role,
        campId: volunteer.campId,
        token: generateToken(volunteer),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const sendOTP = async (req, res) => {
  try {
    const { phone, device } = req.body;

    if (!phone) {
      return res
        .status(400)
        .json({ success: false, message: "Phone number is required" });
    }

    let user = await User.findOne({ phone });

    // Generate 6 digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    if (!user) {
      // Register new user (we'll ask name later or in next step)
      user = await User.create({
        phone,
        name: `User_${phone.slice(-4)}`, // temporary name
        otp,
        otpExpiry: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        devices: device ? [device] : [],
      });
    } else {
      // Existing user
      user.otp = otp;
      user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

      if (device) {
        const existingDevice = user.devices.find(
          (d) => d.deviceId === device.deviceId,
        );
        if (!existingDevice) {
          user.devices.push(device);
        } else {
          existingDevice.lastLogin = new Date();
        }
      }
      await user.save();
    }

    // TODO: Send OTP via SMS (Twilio / MSG91 / Fast2SMS etc.)
    console.log(`OTP for ${phone} is: ${otp}`); // Remove in production

    res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      data: { phone, otp },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Verify OTP
export const verifyOTP = async (req, res) => {
  try {
    const { phone, otp, device } = req.body;

    const user = await User.findOne({ phone }).select("+otp +otpExpiry");

    if (!user || !user.otp || !user.otpExpiry) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid request" });
    }

    if (user.otpExpiry < new Date()) {
      return res
        .status(400)
        .json({ success: false, message: "OTP has expired" });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    // Clear OTP after successful verification
    user.otp = undefined;
    user.otpExpiry = undefined;

    if (device) {
      const existingDevice = user.devices.find(
        (d) => d.deviceId === device.deviceId,
      );
      if (!existingDevice) user.devices.push(device);
      else existingDevice.lastLogin = new Date();
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        _id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        token: generateToken(user),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const userId = req.params.id;

    console.log("BODY:", req.body);
    console.log("FILE:", req.file);

    const { name, email, phone } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check email uniqueness
    if (email && email !== user.email) {
      const existingEmail = await User.findOne({
        email,
        _id: { $ne: userId },
      });

      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: "Email already exists",
        });
      }

      user.email = email;
    }

    // Check phone uniqueness
    if (phone && phone !== user.phone) {
      const existingPhone = await User.findOne({
        phone,
        _id: { $ne: userId },
      });

      if (existingPhone) {
        return res.status(400).json({
          success: false,
          message: "Phone number already exists",
        });
      }

      user.phone = phone;
    }

    // Update basic fields
    if (name) user.name = name;

    // Update profile image
    if (req.file) {
      user.profileImage = req.file.path; // or req.file.filename
    }

    // Update location if sent
    if (req.body.latitude && req.body.longitude) {
      user.activeLocation = {
        latitude: Number(req.body.latitude),
        longitude: Number(req.body.longitude),
        updatedAt: new Date(),
      };
    }

    const updatedUser = await user.save();

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Update User Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    // Check User collection
    let profile = await User.findById(userId).select(
      "-password -otp -otpExpiry",
    );

    let profileType = "user";

    // If not found in User, check Volunteer
    if (!profile) {
      profile = await Volunteer.findById(userId)
        .select("-password")
        .populate("campId", "name location")
        .populate("createdBy", "name email phone");

      profileType = "volunteer";
    }

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      profileType,
      data: profile,
    });
  } catch (error) {
    console.error("Get Profile Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const checkUserExists = async (req, res) => {
  try {
    const { email, phone, agent_id } = req.body;

    const response = {
      emailExists: false,
      phoneExists: false,
      agentIdExists: false,
    };

    if (email) {
      const emailUser = await User.exists({ email });
      response.emailExists = !!emailUser;
    }

    if (phone) {
      const phoneUser = await User.exists({ phone });
      response.phoneExists = !!phoneUser;
    }

    if (agent_id) {
      const agentUser = await User.exists({ agent_id });
      response.agentIdExists = !!agentUser;
    }

    return res.status(200).json({
      success: true,
      data: response,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// export const updateActiveLocation = async (req, res) => {
//   try {
//     const userId = req.user.id; // Assuming auth middleware sets req.user

//     const { latitude, longitude } = req.body;

//     // Validation
//     if (
//       latitude === undefined ||
//       longitude === undefined
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "Latitude and longitude are required",
//       });
//     }

//     const updatedUser = await User.findByIdAndUpdate(
//       userId,
//       {
//         activeLocation: {
//           latitude,
//           longitude,
//           updatedAt: new Date(),
//         },
//       },
//       {
//         new: true,
//         runValidators: true,
//       }
//     ).select("name phone activeLocation");

//     if (!updatedUser) {
//       return res.status(404).json({
//         success: false,
//         message: "User not found",
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Location updated successfully",
//       data: updatedUser.activeLocation,
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// @desc    Auth with Google
// @route   POST /api/auth/google
// @access  Public
// export const googleAuth = async (req, res) => {
//   const { idToken, device } = req.body;

//   try {
//     const ticket = await client.verifyIdToken({
//       idToken,
//       audience: process.env.GOOGLE_CLIENT_ID,
//     });

//     const { name, email, sub: googleId } = ticket.getPayload();

//     let user = await User.findOne({ email });

//     if (user) {
//       user.googleId = googleId;
//       // Add device if not already present
//       if (device && !user.devices.some(d => d.deviceId === device.deviceId)) {
//         user.devices.push(device);
//       }
//       await user.save();
//     } else {
//       user = await User.create({
//         name,
//         email,
//         googleId,
//         password: Math.random().toString(36).slice(-8), // Temporary random password
//         devices: device ? [device] : [],
//         phone: 'Not provided' // Or handle separately
//       });
//     }

//     res.json({
//       _id: user._id,
//       name: user.name,
//       email: user.email,
//       role: user.role,
//       token: generateToken(user._id),
//     });
//   } catch (error) {
//     res.status(400).json({ message: 'Google authentication failed', error: error.message });
//   }
// };
