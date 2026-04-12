import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        firstName: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        githubId: {
            type: String,
            required: true,
            unique: true,
        },
        messAllowancesLeft: {
            type: [String],
            default: ["Breakfast", "Lunch", "Snack", "Dinner"],
        },
        qrCode: {
            type: String,
            unique: true,
            sparse: true,
        },
        phone: {
            type: String,
            default: "",
        },
        messPlan: {
            type: String,
            enum: ["Premium", "Standard", "Basic"],
            default: "Standard",
        },
        totalAllowances: {
            type: Number,
            default: 4,
        },
        messHistory: [
            {
                mealType: String,
                removedAt: Date,
            },
        ],
    },
    { timestamps: true },
);

export const User = mongoose.model("User", userSchema);
