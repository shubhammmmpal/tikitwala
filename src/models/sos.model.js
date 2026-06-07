import mongoose from "mongoose";

const sosSchema = new mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    message: String,

    latitude: Number,

    longitude: Number,

    status: {
        type: String,
        enum: [
            "pending",
            "accepted",
            "resolved"
        ],
        default: "pending"
    },
    sosType:{
        type: String,
        enum: [
            "medical",
            "police",
        ],
        required: true
    },

    assigned:{
        type: Boolean,
        default: false
    },

    

    assignedCamp: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Camp",
        default: null
    },
    volunteerId:{
        type:mongoose.Schema.Types.ObjectId,
        ref: "Volunteer",
        default: null
    },
    rejectedBy:[mongoose.Schema.Types.ObjectId],
    transferredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Camp",
    default: null
},

    acceptedAt: Date

}, {
    timestamps: true
});

export default mongoose.model(
    "SOS",
    sosSchema
);