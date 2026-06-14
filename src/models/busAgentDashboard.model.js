import mongoose from "mongoose";

const busAgentDashboardSchema = new mongoose.Schema({
    agentId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    totalTrips:{
        type: Number,
        default: 0
    },
    totalPassengers:{
        type: Number,
        default: 0
    },
    totalRevenue:{
        type: Number,
        default: 0
    },
    // totalCommision:{
    //     type: Number,
    //     default: 0
    // },
    currentMonthPessanger:{
        type: Number,
        default: 0
    },
    // currentMonthCommision:{
    //     type: Number,
    //     default: 0
    // },
    currentMonthRevenue:{
        type: Number,
        default: 0
    },
    currentMonthTrips:{
        type: Number,
        default: 0  
    },
    todayRevenue:{
        type: Number,
        default: 0
    },
    // todayCommision:{
    //     type: Number,
    //     default: 0
    // },
    todayTrips:{
        type: Number,
        default: 0
    },
    todayPessanger:{
        type: Number,
        default: 0
    }
},{
    timestamps: true
});

const BusAgentDashboard = mongoose.model("BusAgentDashboard", busAgentDashboardSchema);
export default BusAgentDashboard;