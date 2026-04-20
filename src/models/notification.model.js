// notification.model.js
import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  title: { type: String, required: true },
  message: { type: String, required: true },
  
  type: {
    type: String,
    enum: ['BOOKING_CONFIRMED', 'PAYMENT_SUCCESS', 'BOOKING_CANCELLED', 'AGENT_COMMISSION', 'PROMOTION', 'SYSTEM'],
    required: true
  },
  
  isRead: { type: Boolean, default: false },
  data: mongoose.Schema.Types.Mixed, // e.g. { bookingId, amount }
  
  expiresAt: Date // auto-delete old notifications via TTL index
}, { timestamps: true });

notificationSchema.index({ user: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;