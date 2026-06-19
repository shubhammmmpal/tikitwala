import mongoose from "mongoose";

const campSchema = new mongoose.Schema({
    campName: { type: String, required: true },
    campType: { type: String, enum: ["medical", "police","rest_room","water_and_food","other"]},
    phone: { type: Number, required: true },
    stallno: { type: String, required: true },
    image: [String],
    icon: { type: String },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    description: { type: String },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
}, {
    timestamps: true
});

const Camp = mongoose.model("Camp", campSchema);
export default Camp;
    