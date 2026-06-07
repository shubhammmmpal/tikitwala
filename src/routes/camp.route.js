import express from "express";
import {
    createCamp,
    getAllCamps,
    getCampById,
    updateCamp,
    deleteCamp,
    getCampsByUserId,
    getNearbyActiveUsers,
    campDashboard
} from "../controllers/camp.controller.js";
import upload from "../middleware/uploadMiddleware.js";
import { protect } from "../middleware/authMiddleware.js";



const router = express.Router();

router.post(
  "/create-camp",
  upload("camp").array("image", 10),
  createCamp
);
router.get(
  "/camp-dashboard",
  protect,
  campDashboard
);

router.get(
  "/agent/nearby-users",
  protect,
  getNearbyActiveUsers
);
router.get("/", getAllCamps);
router.get("/:id", getCampById);
router.put(
  "/:id",
  upload("camp").array("image", 10),
  updateCamp
);
router.get("/user/:userId", getCampsByUserId);
router.delete("/:id", deleteCamp);


export default router;