import mongoose from "mongoose";

const mapRouteSchema = new mongoose.Schema(
  {
    name: String,

    waypoints: [
      {
        name: String,
        lat: Number,
        lng: Number,
      },
    ],

    routeCoordinates: [
      {
        lat: Number,
        lng: Number,
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("MapRoute", mapRouteSchema);