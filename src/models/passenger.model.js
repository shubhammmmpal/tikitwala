import mongoose from "mongoose";

const passengerSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true
    },

    phone: {
        type: String,
        // required: true
    },
    
    email: {
        type: String,
    },
    age:{
        type: Number,
    },
    gender:{
        type: String,   
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    } 
}, {
    timestamps: true
});

const Passenger = mongoose.model("Passenger", passengerSchema);
export default Passenger;