import express from "express";
// import { registerUser, authUser,
//     //  googleAuth
//     } from '../controllers/auth.controller.js';
import {
  signup,
  signin,
  sendOTP,
  verifyOTP,
  updateActiveLocation,
  updateUser,
  getProfile,
  checkUserExists,
  getAllAdmins,
  getUserById,
  changeUserStatus,
    deleteUser
} from "../controllers/auth.controller.js   ";
import { protect } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";
const router = express.Router();

// router.post('/register', registerUser);
// router.post('/login', authUser);
// router.post('/google', googleAuth);
  router.get("/admins", getAllAdmins);


router.get("/:id", getUserById);

router.patch("/:id/status", changeUserStatus);

router.delete("/:id", deleteUser);
router.post("/signup", signup);
router.post("/signin", signin);
router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTP);
router.put("/active-location", protect, updateActiveLocation);
router.post('/check-user-exists', checkUserExists);
router.put(
  "/update/:id",
  protect,
  upload("users").single("profileImage"),
  updateUser,
);
router.get("/profile", protect, getProfile);

router.get("/test-socket", (req, res) => {
  const io = getIO();

  io.to("all-camps").emit("location-updated", {
    message: "Socket working",
    time: new Date(),
  });

  




  return res.json({
    success: true,

  });
});
export default router;
