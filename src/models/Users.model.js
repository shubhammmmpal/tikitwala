// user.model.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address']
  },
  
  password: { 
    type: String, 
    required: true, 
    minlength: 8 
    // ⚠️ Always hash before saving (use pre-save hook + bcrypt)
  },
  
  phone: { 
    type: String, 
    required: true, 
    unique: true 
  },
  
  role: {
    type: String,
    enum: ['ADMIN', 'AGENT', 'USER'],
    required: true,
    default: 'USER'
  },

  // Role-specific fields (AGENT only)
  commissionPercentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  
  walletBalance: {
    type: Number,
    default: 0,
    min: 0
  },
  
  kycStatus: {
    type: String,
    enum: ['PENDING', 'VERIFIED', 'REJECTED'],
    default: 'PENDING'
  },
  
  bankDetails: {
    accountNumber: String,
    ifscCode: String,
    bankName: String,
    accountHolderName: String
  },

  // Common fields
  address: {
    street: String,
    city: String,
    state: String,
    country: { type: String, default: 'India' },
    pincode: String
  },
  
  isActive: { type: Boolean, default: true },
  isEmailVerified: { type: Boolean, default: false },
  lastLoginAt: Date,
  
  // For future OTP / 2FA
  verificationToken: String,
  verificationTokenExpiry: Date
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Indexes (performance-critical)
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ phone: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ 'address.city': 1 });

// Pre-save hook for role-based validation & defaults
userSchema.pre('save', function(next) {
  if (this.role !== 'AGENT') {
    this.commissionPercentage = 0;
    this.walletBalance = 0;
    this.kycStatus = undefined;
  }
  if (this.role === 'AGENT' && !this.commissionPercentage) {
    this.commissionPercentage = 10; // sensible default for new agents
  }
  next();
});

const User = mongoose.model('User', userSchema);
export default User;