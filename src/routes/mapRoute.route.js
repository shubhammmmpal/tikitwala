import { Router } from "express";
import { createRoute,getAllMapRoutes,getMapRouteById } from "../controllers/mapRoute.controller.js";

const router = Router();

// Add Country - Protected, Admin only

router.post("/", createRoute);
router.get("/", getAllMapRoutes);
router.get("/:id", getMapRouteById);


export default router;