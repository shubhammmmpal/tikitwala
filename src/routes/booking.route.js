import express from "express";
import { bookBusTrip } from "../controllers/booking.controller.js";
// import { protect } from "../middleware/authMiddleware.js";   // Your auth middleware

const router = express.Router();

router.post("/book", bookBusTrip);

export default router;