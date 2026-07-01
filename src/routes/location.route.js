import { Router } from "express";
import { addCountry,getAllCountries,getStatesByCountryId,getCitiesByStateId,getCityList,  addPickupPoint,
  addDropPoint,
  getAllPickupPointByCityId,
  getAllDropPointByCityId,
getStates } from "../controllers/location.controller.js";

const router = Router();

// Add Country - Protected, Admin only
router.post("/country", addCountry);

// Get All Countries - Public
router.get("/countries", getAllCountries);
router.get("/states/by-country/:country_id", getStatesByCountryId);
router.get("/cities/state/:state_id", getCitiesByStateId);

router.get("/city-list", getCityList);
router.post("/add-pickup-point", addPickupPoint);
router.get("/state", getStates);


router.post("/add-drop-point", addDropPoint);

router.get(
  "/pickup-points/:cityId",
  getAllPickupPointByCityId
);

router.get(
  "/drop-points/:cityId",
  getAllDropPointByCityId
);




export default router;