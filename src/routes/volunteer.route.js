import express from "express";

import {
  createVolunteer,
  // getVolunteersByCamp,
  updateVolunteer,
  getVolunteersByCamp,
  getVolunteerById,
  deleteVolunteer,
} from "../controllers/volunteer.controller.js";
import upload from "../middleware/uploadMiddleware.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post(
  "/create",
  protect,
  upload("volunteers").single("image"),
  createVolunteer,
);
router.get("/:id", getVolunteerById);
router.get("/camp/:campId", getVolunteersByCamp);

router.put("/:id", upload("volunteers").single("image"), updateVolunteer);

// router.get("/camp/:campId", getVolunteersByCamp);



router.delete("/:id", deleteVolunteer);

export default router;
