import Route from "../models/mapRoute.model.js";

export const createRoute = async (req, res) => {
  try {
    const { name, waypoints, routeCoordinates } = req.body;

    console.log(routeCoordinates)
    const route = await Route.create({
      name,
      waypoints,
      routeCoordinates: routeCoordinates.map(
        ([lat, lng]) => ({
          lat,
          lng,
        })
      ),
    });

    res.status(201).json(route);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const getAllMapRoutes = async (req, res) => {
  try {
    const routes = await Route.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: routes.length,
      data: routes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get route by ID
export const getMapRouteById = async (req, res) => {
  try {
    const route = await Route.findById(req.params.id);

    if (!route) {
      return res.status(404).json({
        success: false,
        message: "Route not found",
      });
    }

    res.status(200).json({
      success: true,
      data: route,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};