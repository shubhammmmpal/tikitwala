import mongoose from "mongoose";

const HotelAgentDashboardSchema = new mongoose.Schema({
    agentId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    totalBookedRooms:{
        type: Number,
        default: 0
    },
    totalRevenue:{
        type: Number,
        default: 0
    },
    
    currentMonthRevenue:{
        type: Number,
        default: 0
    },
    currentMonthBookedRooms:{
        type: Number,
        default: 0  
    },
    todayRevenue:{
        type: Number,
        default: 0
    },
    todayBookedRooms:{
        type: Number,
        default: 0
    },
},{
    timestamps: true
});

const HotelAgentDashboard = mongoose.model("HotelAgentDashboard", HotelAgentDashboardSchema);
export default HotelAgentDashboard;