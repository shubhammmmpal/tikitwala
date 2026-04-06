import mongoose from 'mongoose';
import BusTrip from './src/models/BusTrip.model.js'; // ← Change path if needed
// import busData from './data/buses.json' assert { type: "json" };   // your json file

const seedDatabase = async () => {
  try {
    await mongoose.connect('process.env.MONGO_URI'); // change DB name if needed
    
    await BusTrip.deleteMany({});           // Clear old data
    await BusTrip.insertMany(busData);
    
    console.log("✅ Seeding Successful! Total buses inserted:", busData.length);
    process.exit();
  } catch (error) {
    console.error("❌ Seeding Failed:", error);
    process.exit(1);
  }
};

seedDatabase();