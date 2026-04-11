import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const adminSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: [true, "password is required to fill in."],
            default: "devdays_admin1",
        },
        refreshToken: {
            type: String,
        },
    },
    { timestamps: true },
);

adminSchema.pre("save", async function (next) {
    if (this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10);
    next();
});

adminSchema.methods.comparePassword = async function (adminPassword) {
    return await bcrypt.compare(adminPassword, this.password);
};

adminSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            id: this._id,
            username: this.username,
        },
        process.env.JWT_ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.JWT_ACCESS_TOKEN_SECRET_EXPIRY,
        },
    );
};

adminSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            id: this._id,
        },
        process.env.JWT_REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.JWT_REFRESH_TOKEN_SECRET_EXPIRY,
        },
    );
};

export const Admin = mongoose.model("Admin", adminSchema);
