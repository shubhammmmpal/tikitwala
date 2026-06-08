import mongoose from "mongoose";

const inventoryHotelSchema = new mongoose.Schema({
     createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref : "User",
     },
     hotelId:{
        type: mongoose.Schema.Types.ObjectId,
        ref : "Hotel",
     },
     inventory:[
        {
            dealPrice: Number,
            basePrice:Number,
            roomType:String,
            totalCount:Number,
            bookedCount:Number
        }
     ]
},
{
   timestamps: true 
})

export default mongoose.model("InventoryHotel", inventoryHotelSchema);

