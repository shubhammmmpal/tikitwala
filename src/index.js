import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from "http";
import { Server } from "socket.io";
import { initializeSocket } from './socket/socket.js';

import connectDB from './config/db.js';
import authRoutes from './routes/auth.route.js';
import busRoutes from './routes/bus.route.js';
import agencyRoutes from './routes/agency.route.js';
import busTripRoutes from './routes/busTrip.route.js';
import bookingRoutes from './routes/booking.route.js';
import hotelRoutes from './routes/hotel.route.js';
import adminHotelRoutes from './routes/adminHotel.route.js';
import roomRoutes from './routes/room.route.js';
import adminRoomRoutes from './routes/adminRoom.route.js';
import bookingHotelRoutes from './routes/bookingHotel.route.js';
import agentRoutes from './routes/agent.route.js';
// import paymentRoutes from './routes/payment.route.js';
import reviewRoutes from './routes/review.route.js';
import couponRoutes from './routes/coupon.route.js';
// import agentRoutes from './routes/agent.route.js';
// import wishlistRoutes from './routes/wishlistRoutes.js';
// import notificationRoutes from './routes/notificationRoutes.js';
// import adminDashboardRoutes from './routes/adminDashboardRoutes.js';
import locationRoutes from './routes/location.route.js';
import travelTripRoutes from "./routes/travelTrip.route.js";
import inquiryRoutes from "./routes/inquiry.route.js";
import carRentRoute from "./routes/carRent.route.js";
import carInquiryRoutes from "./routes/carInquiry.route.js";
import campRoutes from "./routes/camp.route.js";
import sosRoutes from "./routes/sos.route.js";
import volunteerRoutes from "./routes/volunteer.route.js"
import passengerRoutes from "./routes/passenger.route.js";
import BusDashboard from "./routes/busDashboard.route.js"
import mapRouteRoutes from "./routes/mapRoute.route.js"

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/buses', busRoutes);
app.use('/api/agencies', agencyRoutes);
app.use('/api/bus-trips', busTripRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/hotels', hotelRoutes);
app.use('/api/admin/hotels', adminHotelRoutes);
app.use('/api', roomRoutes);                    // Public room routes
app.use('/api/admin/rooms', adminRoomRoutes);   // Admin room routes
app.use('/api/hotel/bookings', bookingHotelRoutes);
app.use('/api/agent', agentRoutes);
// app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/travel-trips', travelTripRoutes);
app.use("/api/inquiry", inquiryRoutes);
app.use("/api/car-rent", carRentRoute);
app.use("/api/car-inquiry", carInquiryRoutes);
app.use("/api/camps", campRoutes);

app.use("/api/sos", sosRoutes);
app.use("/api/volunteer", volunteerRoutes)
app.use("/api/passengers", passengerRoutes);
app.use("/api/bus-dashboard", BusDashboard);
app.use("/api/map-routes", mapRouteRoutes);
// app.use('/api/agent', agentRoutes);
// app.use('/api/wishlist', wishlistRoutes);
// app.use('/api/notifications', notificationRoutes);
// app.use('/api/admin/dashboard', adminDashboardRoutes);



app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Start server
// app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
// });



initializeSocket(server);

server.listen(PORT, () => {
  console.log(
    `Server running on port ${PORT}`
  );
});