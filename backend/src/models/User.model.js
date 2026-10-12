import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    password: {
      type: String,
      // Not required for accounts created via social login (Google/LinkedIn) -
      // those users authenticate through the provider, not a local password.
      required: [
        function passwordRequired() {
          return !this.googleId && !this.linkedinId && !this.githubId;
        },
        "Password is required",
      ],
      minlength: [8, "Password must be at least 8 characters"],
      select: false, // never return password by default on queries
    },
    // Social login - real Google/LinkedIn OAuth, each optional and unique per provider.
    googleId: { type: String, unique: true, sparse: true },
    linkedinId: { type: String, unique: true, sparse: true },
    githubId: { type: String, unique: true, sparse: true },
    avatarUrl: { type: String, default: null },
    // Only set for avatars the user uploaded themselves (via POST
    // /users/avatar) - null for Google/LinkedIn profile photos, since we
    // don't own those assets and can't/shouldn't delete them from Cloudinary.
    avatarPublicId: { type: String, default: null, select: false },
    isVerified: {
      type: Boolean,
      default: false,
    },
    onboardingComplete: {
      type: Boolean,
      default: false,
    },
    // Email verification
    verificationToken: { type: String, select: false },
    verificationTokenExpires: { type: Date, select: false },
    // Password reset
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
  },
  { timestamps: true }
);

// Hash password before save, only if it was modified (avoids re-hashing on unrelated updates)
userSchema.pre("save", async function hashPassword() {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Instance method to compare plaintext password against stored hash
userSchema.methods.comparePassword = async function comparePassword(candidatePassword) {
  if (!this.password) return false; // social-login-only account, no local password set
  return bcrypt.compare(candidatePassword, this.password);
};

// Never leak sensitive fields even if someone accidentally selects them
userSchema.methods.toSafeObject = function toSafeObject() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    avatarUrl: this.avatarUrl,
    isVerified: this.isVerified,
    onboardingComplete: this.onboardingComplete,
    createdAt: this.createdAt,
  };
};

const User = mongoose.model("User", userSchema);

export default User;
