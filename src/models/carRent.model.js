import mongoose from "mongoose";

const carRentSchema = new mongoose.Schema({
  carModel: { type: String, required: true },
  transmission: { type: String, enum: ['Automatic', 'Manual'], required: true },
  discription: { type: String },
  seatsCount: { type: Number, required: true },
  fuelType: { type: String, required: true },
  pricePerDay: { type: Number, required: true },
  availability: { type: Boolean, default: true },
  location: { type: String, required: true },
  features: [String], // e.g. ["GPS", "Air Conditioning"]
  status: {
    type: String,
    enum: ["ACTIVE","INACTIVE","MAINTANACE"],
    default : "ACTIVE"
  },
  images: [],
}, {
  timestamps: true
});

const CarRent = mongoose.model("CarRent", carRentSchema);
export default CarRent;