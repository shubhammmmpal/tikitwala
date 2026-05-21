import mongoose from "mongoose";

const pickAndDropPointByCitySchema = new mongoose.Schema({
  city: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'City',
    required: true
  },
  pickupPoints: [{
    name: { type: String, required: true },
    datetime: { type: Date, required: true },
    // order: { type: Number } // sequence of stop
  }],
    dropPoints: [{
        name: { type: String, required: true },
        datetime: { type: Date, required: true },
        // order: { type: Number }
    }]
});

export default mongoose.model("PickAndDropPointByCity", pickAndDropPointByCitySchema);