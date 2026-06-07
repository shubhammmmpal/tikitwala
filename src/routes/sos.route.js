import express from "express";

import {
  createSOS,
  getPendingSOS,
  acceptSOS,
  getMyAssignedSOS,
  getAgentSOS,
  approveSOS,
  rejectSOS,
  transferSOS,
  getSOSByCamp
} from "../controllers/sos.controller.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/create", protect, createSOS);

router.get("/pending", protect, getPendingSOS);

router.post("/:sosId/accept", protect, acceptSOS);

router.get("/my-assigned", protect, getMyAssignedSOS);

router.get("/agent", protect, getAgentSOS);
router.patch("/:sosId/accepted", protect, approveSOS);
router.patch("/:sosId/reject", protect, rejectSOS);

router.patch("/:sosId/transfer", protect, transferSOS);
router.get(
    "/camp/:campId",
    protect,
    getSOSByCamp
);

export default router;
