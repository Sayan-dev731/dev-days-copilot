import { User } from "../models/users.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Get all users
const getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.find().select("-__v");
    return res
        .status(200)
        .json(new ApiResponse(200, "Users fetched successfully", users));
});

// Get user by ID
const getUserById = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!userId) {
        throw new ApiError(400, "User ID is required");
    }

    const user = await User.findById(userId);

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, "User fetched successfully", user));
});

// Get user by QR code (for scanning)
const getUserByQRCode = asyncHandler(async (req, res) => {
    const { qrCode } = req.body;

    if (!qrCode) {
        throw new ApiError(400, "QR code is required");
    }

    // Try to find user by qrCode field first
    let user = await User.findOne({ qrCode });

    // If not found, try to find by _id (for backward compatibility with existing users)
    if (!user) {
        user = await User.findById(qrCode);
    }

    if (!user) {
        throw new ApiError(404, "User not found with this QR code");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, "User found successfully", user));
});

// Add new user
const addUser = asyncHandler(async (req, res) => {
    const { firstName, email, githubId, phone, messPlan } = req.body;

    // Validate inputs
    if (!firstName || !email || !githubId) {
        throw new ApiError(
            400,
            "First name, email, and GitHub ID are required",
        );
    }

    // Check if user already exists
    const existingUser = await User.findOne({
        $or: [{ email }, { githubId }],
    });

    if (existingUser) {
        throw new ApiError(
            409,
            "User with this email or GitHub ID already exists",
        );
    }

    // Create QR code (using user _id - will be generated after user creation)
    const newUser = await User.create({
        firstName,
        email,
        githubId,
        phone: phone || "",
        messPlan: messPlan || "Standard",
    });

    // Generate QR code as the user's _id (unique identifier)
    newUser.qrCode = newUser._id.toString();
    await newUser.save();

    return res
        .status(201)
        .json(new ApiResponse(201, "User created successfully", newUser));
});

// Update user
const updateUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { firstName, email, phone, messPlan } = req.body;

    if (!userId) {
        throw new ApiError(400, "User ID is required");
    }

    const user = await User.findById(userId);

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Update allowed fields
    if (firstName) user.firstName = firstName;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (messPlan) user.messPlan = messPlan;

    await user.save();

    return res
        .status(200)
        .json(new ApiResponse(200, "User updated successfully", user));
});

// Delete user
const deleteUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!userId) {
        throw new ApiError(400, "User ID is required");
    }

    const user = await User.findByIdAndDelete(userId);

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, "User deleted successfully", user));
});

// Remove meal allowance (when scanned)
const removeMealAllowance = asyncHandler(async (req, res) => {
    const { userId, mealType } = req.body;

    if (!userId || !mealType) {
        throw new ApiError(400, "User ID and meal type are required");
    }

    const validMeals = ["Breakfast", "Lunch", "Snack", "Dinner"];
    if (!validMeals.includes(mealType)) {
        throw new ApiError(
            400,
            "Invalid meal type. Must be one of: Breakfast, Lunch, Snack, Dinner",
        );
    }

    const user = await User.findById(userId);

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Check if meal allowance exists
    if (!user.messAllowancesLeft.includes(mealType)) {
        throw new ApiError(
            400,
            `${mealType} allowance already used or not available`,
        );
    }

    // Remove meal allowance
    user.messAllowancesLeft = user.messAllowancesLeft.filter(
        (meal) => meal !== mealType,
    );

    // Add to history
    user.messHistory.push({
        mealType,
        removedAt: new Date(),
    });

    await user.save();

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                `${mealType} allowance removed successfully`,
                user,
            ),
        );
});

// Reset mess allowances for user
const resetMealAllowances = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!userId) {
        throw new ApiError(400, "User ID is required");
    }

    const user = await User.findById(userId);

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    user.messAllowancesLeft = ["Breakfast", "Lunch", "Snack", "Dinner"];
    await user.save();

    return res
        .status(200)
        .json(new ApiResponse(200, "Meal allowances reset successfully", user));
});

// Get user statistics
const getUserStats = asyncHandler(async (req, res) => {
    const totalUsers = await User.countDocuments();
    const usersWithMeals = await User.countDocuments({
        messAllowancesLeft: { $gt: [] },
    });
    const usersWithoutMeals = await User.countDocuments({
        messAllowancesLeft: { $size: 0 },
    });

    const stats = {
        totalUsers,
        usersWithMeals,
        usersWithoutMeals,
        mealsUsedToday: await User.aggregate([
            {
                $project: {
                    mealCount: {
                        $subtract: [4, { $size: "$messAllowancesLeft" }],
                    },
                },
            },
            {
                $group: {
                    _id: null,
                    totalMealsUsed: { $sum: "$mealCount" },
                },
            },
        ]),
    };

    return res
        .status(200)
        .json(new ApiResponse(200, "Statistics fetched successfully", stats));
});

// Bulk import users from CSV
const bulkImportUsers = asyncHandler(async (req, res) => {
    const { users } = req.body;

    if (!Array.isArray(users) || users.length === 0) {
        throw new ApiError(400, "Users array is required and cannot be empty");
    }

    const createdUsers = [];
    const errors = [];

    for (let i = 0; i < users.length; i++) {
        try {
            const { firstName, email, githubId, phone, messPlan } = users[i];

            if (!firstName || !email || !githubId) {
                errors.push({
                    index: i,
                    error: "Missing required fields: firstName, email, githubId",
                });
                continue;
            }

            const existingUser = await User.findOne({
                $or: [{ email }, { githubId }],
            });
            if (existingUser) {
                errors.push({
                    index: i,
                    error: "User already exists with this email or GitHub ID",
                });
                continue;
            }

            const newUser = await User.create({
                firstName,
                email,
                githubId,
                phone: phone || "",
                messPlan: messPlan || "Standard",
            });

            newUser.qrCode = newUser._id.toString();
            await newUser.save();
            createdUsers.push(newUser);
        } catch (error) {
            errors.push({
                index: i,
                error: error.message,
            });
        }
    }

    return res.status(200).json(
        new ApiResponse(200, "Bulk import completed", {
            created: createdUsers,
            errors,
            summary: {
                total: users.length,
                created: createdUsers.length,
                failed: errors.length,
            },
        }),
    );
});

export {
    getAllUsers,
    getUserById,
    getUserByQRCode,
    addUser,
    updateUser,
    deleteUser,
    removeMealAllowance,
    resetMealAllowances,
    getUserStats,
    bulkImportUsers,
};
