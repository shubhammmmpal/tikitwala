import mongoose from "mongoose";

const inquirySchema = new mongoose.Schema({
  travelTripId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "TravelTrip",
    required: true
  },
  userid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  travellers:{String},
  message: { type: String },
  datefrom: { type: Date, required: true },
  dateto: { type: Date, required: true },
  name: { type: String, required: true },
  phone: { type: Number, required: true },    
},
{
   timestamps: true 
})

export default mongoose.model("Inquiry", inquirySchema);

