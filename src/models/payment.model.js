// payment.model.js
import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
    index: true
  },
  
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  
  paymentMethod: {
    type: String,
    enum: ['CARD', 'UPI', 'NET_BANKING', 'WALLET', 'CASH_ON_PROPERTY'],
    required: true
  },
  
  status: {
    type: String,
    enum: ['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'],
    default: 'PENDING'
  },
  
  transactionId: { 
    type: String, 
    sparse: true 
    // Unique enforced at application level per gateway
  },
  
  gatewayResponse: mongoose.Schema.Types.Mixed, // Full Razorpay/Stripe response
  
  refund: {
    refundId: String,
    amount: Number,
    reason: String,
    status: String,
    refundedAt: Date
  },
  
  paidAt: Date
}, { timestamps: true });

paymentSchema.index({ booking: 1 });
paymentSchema.index({ transactionId: 1 }, { sparse: true });

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;