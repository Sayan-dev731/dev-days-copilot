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
    },
    { timestamps: true },
);

export const User = mongoose.model("User", userSchema);
