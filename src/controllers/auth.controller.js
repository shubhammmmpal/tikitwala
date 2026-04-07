import User from '../models/User.model.js';
import generateToken from '../utils/generateToken.js';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const signup = async (req, res) => {
  try {
    const { name, email, phone, password, device } = req.body;

    // Check existing user
    const userExists = await User.findOne({
      $or: [{ email }, { phone }]
    });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      phone,
      password,
      devices: device ? [device] : []
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        token: generateToken(user)
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
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
    const { email, password, device } = req.body;

    // Find user with password
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Match password
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Handle device
    if (device) {
      const existingDevice = user.devices.find(
        d => d.deviceId === device.deviceId
      );

      if (!existingDevice) {
        user.devices.push(device);
      } else {
        existingDevice.lastLogin = new Date();
      }

      await user.save();
    }

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        token: generateToken(user)
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const sendOTP = async (req, res) => {
  try {
    const { phone, device } = req.body;

    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
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
        devices: device ? [device] : []
      });
    } else {
      // Existing user
      user.otp = otp;
      user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
      
      if (device) {
        const existingDevice = user.devices.find(d => d.deviceId === device.deviceId);
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
      message: 'OTP sent successfully',
      data: { phone,otp }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Verify OTP
export const verifyOTP = async (req, res) => {
  try {
    const { phone, otp, device } = req.body;

    const user = await User.findOne({ phone }).select('+otp +otpExpiry');

    if (!user || !user.otp || !user.otpExpiry) {
      return res.status(400).json({ success: false, message: 'Invalid request' });
    }

    if (user.otpExpiry < new Date()) {
      return res.status(400).json({ success: false, message: 'OTP has expired' });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    // Clear OTP after successful verification
    user.otp = undefined;
    user.otpExpiry = undefined;

    if (device) {
      const existingDevice = user.devices.find(d => d.deviceId === device.deviceId);
      if (!existingDevice) user.devices.push(device);
      else existingDevice.lastLogin = new Date();
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        _id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        token: generateToken(user)
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

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
