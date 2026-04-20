// agentCommission.model.js
import mongoose from 'mongoose';

const agentCommissionSchema = new mongoose.Schema({
  agent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  
  commissionPercentage: { type: Number, required: true },
  commissionAmount: { type: Number, required: true },
  
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'PAID', 'CANCELLED'],
    default: 'PENDING'
  },
  
  paidAt: Date,
  payoutReference: String // bank transfer / wallet credit ID
}, { timestamps: true });

agentCommissionSchema.index({ agent: 1, booking: 1 }, { unique: true });
agentCommissionSchema.index({ status: 1, agent: 1 });

const AgentCommission = mongoose.model('AgentCommission', agentCommissionSchema);
export default AgentCommission;