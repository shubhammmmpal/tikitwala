import express from "express";

import {
    getAllBusDashboards,
    getBusDashboardById,
    getBusDashboardByUserId
} from "../controllers/busDashboard.controller.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/user/:userId", getBusDashboardByUserId);
router.get("/:id", getBusDashboardById);
router.get("/", getAllBusDashboards);

export default router;