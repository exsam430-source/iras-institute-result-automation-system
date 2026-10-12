import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { ROLES } from '../utils/constants.js';

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      minlength: [2, 'First name must be at least 2 characters'],
      maxlength: [50, 'First name cannot exceed 50 characters'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      minlength: [2, 'Last name must be at least 2 characters'],
      maxlength: [50, 'Last name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: {
        values: Object.values(ROLES),
        message: '{VALUE} is not a valid role',
      },
      required: [true, 'Role is required'],
    },
    avatar: {
      type: String,
      default: null,
    },
    avatarPublicId: {
      type: String,
      default: null,
      select: false,
    },
    phone: {
      type: String,
      trim: true,
      default: null,
    },
    cnic: {
      type: String,
      trim: true,
      default: null,
    },
    gender: {
      type: String,
      enum: {
        values: ['male', 'female'],
        message: '{VALUE} is not a valid gender',
      },
      default: null,
    },
    dateOfBirth: {
      type: Date,
      default: null,
    },
    address: {
      street: { type: String, trim: true, default: null },
      city: { type: String, trim: true, default: null },
      district: { type: String, trim: true, default: null },
      province: {
        type: String,
        trim: true,
        default: 'Khyber Pakhtunkhwa',
      },
      country: { type: String, trim: true, default: 'Pakistan' },
    },
    institute: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Institute',
      default: null,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      select: false,
      default: null,
    },
    emailVerificationExpires: {
      type: Date,
      select: false,
      default: null,
    },
    passwordResetToken: {
      type: String,
      select: false,
      default: null,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
      default: null,
    },
    refreshTokens: {
      type: [String],
      select: false,
      default: [],
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    lastLoginIP: {
      type: String,
      default: null,
      select: false,
    },
    loginAttempts: {
      type: Number,
      default: 0,
      select: false,
    },
    lockUntil: {
      type: Date,
      default: null,
      select: false,
    },
    passwordHistory: {
      type: [String],
      select: false,
      default: [],
    },
    mustChangePassword: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── INDEXES ──────────────────────────────────────────────────
userSchema.index({ role: 1 });
userSchema.index({ institute: 1, department: 1 });
userSchema.index({ isActive: 1, role: 1 });
userSchema.index({ createdAt: -1 });
// ✅ NO cnic index here - checked manually in controller

// ─── VIRTUALS ─────────────────────────────────────────────────
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

userSchema.virtual('isLocked').get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

userSchema.virtual('studentProfile', {
  ref: 'StudentProfile',
  localField: '_id',
  foreignField: 'user',
  justOne: true,
});

// ─── PRE SAVE HOOK ────────────────────────────────────────────
// ✅ FIXED: Use async/await properly without calling next()
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
  this.password = await bcrypt.hash(this.password, saltRounds);
});

// ─── INSTANCE METHODS ─────────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.isPasswordUsedBefore = async function (candidatePassword) {
  for (const oldPassword of this.passwordHistory || []) {
    const isMatch = await bcrypt.compare(candidatePassword, oldPassword);
    if (isMatch) return true;
  }
  return false;
};

userSchema.methods.incrementLoginAttempts = async function () {
  const maxAttempts = parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5;
  const lockTime = parseInt(process.env.LOCK_TIME) || 30 * 60 * 1000;

  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1, lockUntil: null },
    });
  }

  const updates = { $inc: { loginAttempts: 1 } };

  if (this.loginAttempts + 1 >= maxAttempts && !this.isLocked) {
    updates.$set = { lockUntil: new Date(Date.now() + lockTime) };
  }

  return this.updateOne(updates);
};

userSchema.methods.resetLoginAttempts = async function () {
  return this.updateOne({
    $set: { loginAttempts: 0, lockUntil: null },
  });
};

userSchema.methods.addRefreshToken = async function (token) {
  this.refreshTokens = [token, ...(this.refreshTokens || [])].slice(0, 5);
  return this.save({ validateBeforeSave: false });
};

userSchema.methods.removeRefreshToken = async function (token) {
  this.refreshTokens = (this.refreshTokens || []).filter((t) => t !== token);
  return this.save({ validateBeforeSave: false });
};

userSchema.methods.removeAllRefreshTokens = async function () {
  this.refreshTokens = [];
  return this.save({ validateBeforeSave: false });
};

// ─── STATIC METHODS ───────────────────────────────────────────
userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase().trim() });
};

userSchema.statics.findActiveByRole = function (role) {
  return this.find({ role, isActive: true });
};

const User = mongoose.model('User', userSchema);
export default User;
