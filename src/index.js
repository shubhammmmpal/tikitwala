import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
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
// import reviewRoutes from './routes/reviewRoutes.js';
// import couponRoutes from './routes/couponRoutes.js';
// import agentRoutes from './routes/agent.route.js';
// import wishlistRoutes from './routes/wishlistRoutes.js';
// import notificationRoutes from './routes/notificationRoutes.js';
// import adminDashboardRoutes from './routes/adminDashboardRoutes.js';

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

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
// app.use('/api/reviews', reviewRoutes);
// app.use('/api/coupons', couponRoutes);
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
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});
