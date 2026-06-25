import mongoose from "mongoose";

const carInquirySchema = new mongoose.Schema({
    carRentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CarRent",
        required: true
    },
    userid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    datefrom: { type: Date, required: true },
    dateto: { type: Date, required: true },
    
}, {
  timestamps: true
});

const CarInquiry = mongoose.model("CarInquiry", carInquirySchema);
export default CarInquiry;