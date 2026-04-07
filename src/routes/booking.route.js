import express from "express";
import { bookBusTrip,getAllBusBookingsList,getBusBookingById,getBusBookingByUserId,changeBookingStatus,deleteBooking } from "../controllers/booking.controller.js";
import { protect } from "../middleware/authMiddleware.js";   // Your auth middleware

const router = express.Router();

router.post("/book",protect, bookBusTrip);
router.get("/", getAllBusBookingsList);
router.get("/:id", getBusBookingById);
router.get("/user/:userId", getBusBookingByUserId);
router.put("/:id/status", changeBookingStatus);
router.delete("/:id", deleteBooking);

export default router;