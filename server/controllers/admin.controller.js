import jwt from "jsonwebtoken";
import { Admin } from "../models/admin.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Temporary default password
const DEFAULT_TEMP_PASSWORD = "devdays_admin1";

// Login Admin
const loginAdmin = asyncHandler(async (req, res) => {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
        throw new ApiError(400, "Username and password and required");
    }

    // Check if username exists in .env GITHUB_ADMIN_USERNAMES
    const allowedAdmins =
        process.env.GITHUB_ADMIN_USERNAMES?.split(",").map((u) => u.trim()) ||
        [];

    if (!allowedAdmins.includes(username)) {
        throw new ApiError(
            401,
            "GitHub username not registered as admin in environment",
        );
    }

    // Find or create admin user
    let admin = await Admin.findOne({ username });

    if (!admin) {
        // Create new admin with temporary password
        admin = await Admin.create({
            username,
            password: DEFAULT_TEMP_PASSWORD,
        });
    }

    // Compare provided password with stored password
    const isPasswordValid = await admin.comparePassword(password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid credentials");
    }

    // Check if using default temporary password
    const isUsingTempPassword = password === DEFAULT_TEMP_PASSWORD;

    // Generate tokens
    const accessToken = admin.generateAccessToken();
    const refreshToken = admin.generateRefreshToken();

    // Save refresh token to database
    admin.refreshToken = refreshToken;
    await admin.save({ validateBeforeSave: false });

    // Set cookies
    const options = {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
    };

    const loginResponse = new ApiResponse(
        200,
        isUsingTempPassword
            ? "Login successful. Please change your temporary password"
            : "Login successful",
        {
            user: {
                id: admin._id,
                username: admin.username,
            },
            accessToken,
            refreshToken,
            isUsingTempPassword,
        },
    );

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(loginResponse);
});

// Signup Admin (for first-time admin creation)
const signupAdmin = asyncHandler(async (req, res) => {
    const { username, password, confirmPassword } = req.body;

    // Validate input
    if (!username || !password || !confirmPassword) {
        throw new ApiError(
            400,
            "Username, password, and confirm password are required",
        );
    }

    if (password !== confirmPassword) {
        throw new ApiError(400, "Passwords do not match");
    }

    if (password.length < 8) {
        throw new ApiError(400, "Password must be at least 8 characters long");
    }

    // Check if username exists in .env GITHUB_ADMIN_USERNAMES
    const allowedAdmins =
        process.env.GITHUB_ADMIN_USERNAMES?.split(",").map((u) => u.trim()) ||
        [];

    if (!allowedAdmins.includes(username)) {
        throw new ApiError(
            401,
            "GitHub username not registered as admin in environment",
        );
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ username });

    if (existingAdmin) {
        throw new ApiError(409, "Admin already exists");
    }

    // Create new admin
    const admin = await Admin.create({
        username,
        password,
    });

    const createdAdmin = await Admin.findById(admin._id).select(
        "-password -refreshToken",
    );

    if (!createdAdmin) {
        throw new ApiError(
            500,
            "Something went wrong while registering the admin",
        );
    }

    // Generate tokens for signup as well
    const accessToken = admin.generateAccessToken();
    const refreshToken = admin.generateRefreshToken();

    // Save refresh token to database
    admin.refreshToken = refreshToken;
    await admin.save({ validateBeforeSave: false });

    // Set cookies
    const options = {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
    };

    const signupResponse = new ApiResponse(
        201,
        "Admin registered successfully",
        {
            user: {
                id: createdAdmin._id,
                username: createdAdmin.username,
            },
            accessToken,
            refreshToken,
            isUsingTempPassword: false, // Signup creates proper password
        },
    );

    return res
        .status(201)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(signupResponse);
});

// Change Password
const changePassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword, confirmPassword } = req.body;
    const adminId = req.admin?._id; // From auth middleware

    // Validate input
    if (!oldPassword || !newPassword || !confirmPassword) {
        throw new ApiError(
            400,
            "Old password, new password, and confirm password are required",
        );
    }

    if (newPassword !== confirmPassword) {
        throw new ApiError(400, "New passwords do not match");
    }

    if (newPassword.length < 8) {
        throw new ApiError(
            400,
            "New password must be at least 8 characters long",
        );
    }

    if (oldPassword === newPassword) {
        throw new ApiError(
            400,
            "New password must be different from old password",
        );
    }

    // Find admin
    const admin = await Admin.findById(adminId);

    if (!admin) {
        throw new ApiError(404, "Admin not found");
    }

    // Verify old password
    const isPasswordValid = await admin.comparePassword(oldPassword);

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid old password");
    }

    // Update password
    admin.password = newPassword;
    await admin.save({ validateBeforeSave: false });

    // Generate new tokens after password change
    const newAccessToken = admin.generateAccessToken();
    const newRefreshToken = admin.generateRefreshToken();

    admin.refreshToken = newRefreshToken;
    await admin.save({ validateBeforeSave: false });

    const options = {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
    };

    return res
        .status(200)
        .cookie("accessToken", newAccessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(200, "Password changed successfully", {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken,
            }),
        );
});

// Refresh Access Token
const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken =
        req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Refresh token is required");
    }

    let decodedToken;
    try {
        decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.JWT_REFRESH_TOKEN_SECRET,
        );
    } catch (error) {
        throw new ApiError(401, "Invalid or expired refresh token");
    }

    const admin = await Admin.findById(decodedToken?.id);

    if (!admin) {
        throw new ApiError(404, "Admin not found");
    }

    if (incomingRefreshToken !== admin?.refreshToken) {
        throw new ApiError(401, "Refresh token mismatch");
    }

    const newAccessToken = admin.generateAccessToken();
    const newRefreshToken = admin.generateRefreshToken();

    admin.refreshToken = newRefreshToken;
    await admin.save({ validateBeforeSave: false });

    const options = {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
    };

    return res
        .status(200)
        .cookie("accessToken", newAccessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(200, "Access token refreshed successfully", {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken,
            }),
        );
});

// Logout Admin
const logoutAdmin = asyncHandler(async (req, res) => {
    await Admin.findByIdAndUpdate(
        req.admin?._id,
        {
            $unset: {
                refreshToken: 1,
            },
        },
        {
            new: true,
        },
    );

    const options = {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, "Admin logged out successfully"));
});

export {
    loginAdmin,
    signupAdmin,
    changePassword,
    refreshAccessToken,
    logoutAdmin,
};
