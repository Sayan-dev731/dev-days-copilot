import jwt from "jsonwebtoken";
import { parse } from "csv-parse/sync";
import { Admin } from "../models/admin.model.js";
import { User } from "../models/users.model.js";
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
            returnDocument: "after",
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

// Upload and Process CSV Files
const uploadAndProcessCSV = asyncHandler(async (req, res) => {
    // Validate that both files are provided
    if (!req.files || !req.files.eventbriteCSV || !req.files.mlhCSV) {
        throw new ApiError(
            400,
            "Both eventbriteCSV and mlhCSV files are required",
        );
    }

    const eventbriteFile = req.files.eventbriteCSV[0];
    const mlhFile = req.files.mlhCSV[0];

    if (!eventbriteFile || !mlhFile) {
        throw new ApiError(400, "Both CSV files are required");
    }

    try {
        // Read and parse Eventbrite CSV
        const eventbriteData = parse(eventbriteFile.buffer.toString("utf-8"), {
            columns: true,
            skip_empty_lines: true,
        });

        // Read and parse MLH CSV
        const mlhData = parse(mlhFile.buffer.toString("utf-8"), {
            columns: true,
            skip_empty_lines: true,
        });

        // Extract emails from both CSVs
        const eventbriteEmails = new Map();
        const mlhEmails = new Set();

        // Process Eventbrite CSV - store with full data
        eventbriteData.forEach((row) => {
            const email = row.email?.toLowerCase().trim();
            if (email) {
                eventbriteEmails.set(email, {
                    firstName: row.firstName || row["First Name"] || "",
                    email: email,
                    githubId:
                        row.githubId || row["GitHub ID"] || row.github || "",
                });
            }
        });

        // Process MLH CSV - just collect emails
        mlhData.forEach((row) => {
            const email = row.email?.toLowerCase().trim();
            if (email) {
                mlhEmails.add(email);
            }
        });

        // Find common emails (present in both CSVs)
        const commonEmails = [];
        const usersToCreate = [];

        for (const [email, userData] of eventbriteEmails) {
            if (mlhEmails.has(email)) {
                commonEmails.push(email);
                // Only add if firstName and githubId are present
                if (userData.firstName && userData.githubId) {
                    usersToCreate.push(userData);
                }
            }
        }

        // Create or update users in MongoDB
        let createdCount = 0;
        let updatedCount = 0;
        const createdUsers = [];
        const errors = [];

        for (const userData of usersToCreate) {
            try {
                const existingUser = await User.findOne({
                    email: userData.email,
                });

                if (existingUser) {
                    // Update existing user without validation
                    await User.updateOne(
                        { email: userData.email },
                        {
                            firstName: userData.firstName,
                            githubId: userData.githubId,
                        },
                        { runValidators: false },
                    );
                    updatedCount++;
                } else {
                    // Create new user using insertOne to bypass validation
                    const result = await User.collection.insertOne({
                        firstName: userData.firstName || "",
                        email: userData.email,
                        githubId: userData.githubId || "",
                        messAllowancesLeft: [
                            "Breakfast",
                            "Lunch",
                            "Snack",
                            "Dinner",
                        ],
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    });
                    const newUser = await User.findById(result.insertedId);
                    createdCount++;
                    createdUsers.push(newUser);
                }
            } catch (error) {
                errors.push({
                    email: userData.email,
                    error: error.message || "Error creating/updating user",
                });
            }
        }

        // Return comprehensive report
        return res.status(200).json(
            new ApiResponse(200, "CSV processing completed successfully", {
                summary: {
                    eventbriteTotal: eventbriteData.length,
                    mlhTotal: mlhData.length,
                    commonEmails: commonEmails.length,
                    validRecords: usersToCreate.length,
                    created: createdCount,
                    updated: updatedCount,
                    errors: errors.length,
                },
                commonEmails,
                createdUsers,
                errors,
            }),
        );
    } catch (error) {
        throw new ApiError(500, error.message || "Error processing CSV files");
    }
});

// Preview CSV files and return structure with ALL data
const previewCSV = asyncHandler(async (req, res) => {
    if (!req.files || !req.files.eventbriteCSV || !req.files.mlhCSV) {
        throw new ApiError(
            400,
            "Both eventbriteCSV and mlhCSV files are required",
        );
    }

    const eventbriteFile = req.files.eventbriteCSV[0];
    const mlhFile = req.files.mlhCSV[0];

    try {
        // Parse both CSV files
        const eventbriteData = parse(eventbriteFile.buffer.toString("utf-8"), {
            columns: true,
            skip_empty_lines: true,
        });

        const mlhData = parse(mlhFile.buffer.toString("utf-8"), {
            columns: true,
            skip_empty_lines: true,
        });

        // Get column names
        const eventbriteColumns =
            eventbriteData.length > 0 ? Object.keys(eventbriteData[0]) : [];
        const mlhColumns = mlhData.length > 0 ? Object.keys(mlhData[0]) : [];

        // Get first 5 rows as sample
        const eventbriteSample = eventbriteData.slice(0, 5);
        const mlhSample = mlhData.slice(0, 5);

        // Find common emails
        const eventbriteEmails = new Set(
            eventbriteData
                .map((row) =>
                    row[
                        Object.keys(row).find((k) =>
                            k.toLowerCase().includes("email"),
                        )
                    ]
                        ?.toLowerCase()
                        .trim(),
                )
                .filter(Boolean),
        );

        const mlhEmails = new Set(
            mlhData
                .map((row) =>
                    row[
                        Object.keys(row).find((k) =>
                            k.toLowerCase().includes("email"),
                        )
                    ]
                        ?.toLowerCase()
                        .trim(),
                )
                .filter(Boolean),
        );

        const commonEmails = Array.from(eventbriteEmails).filter((email) =>
            mlhEmails.has(email),
        );

        return res.status(200).json(
            new ApiResponse(200, "CSV preview retrieved successfully", {
                eventbrite: {
                    columns: eventbriteColumns,
                    sample: eventbriteSample,
                    allData: eventbriteData,
                    totalRows: eventbriteData.length,
                },
                mlh: {
                    columns: mlhColumns,
                    sample: mlhSample,
                    totalRows: mlhData.length,
                },
                commonEmails: {
                    count: commonEmails.length,
                    sample: commonEmails.slice(0, 10),
                    all: commonEmails,
                },
            }),
        );
    } catch (error) {
        throw new ApiError(500, error.message || "Error previewing CSV files");
    }
});

// Process CSV with admin-provided field mappings (Optimized with Batch Operations)
const processCSVWithMapping = asyncHandler(async (req, res) => {
    // Parse JSON fields from FormData
    let eventbriteFieldMapping = req.body.eventbriteFieldMapping;
    let mlhFieldMapping = req.body.mlhFieldMapping;
    let selectedEmails = req.body.selectedEmails;

    // Parse stringified JSON if it's a string
    if (typeof eventbriteFieldMapping === "string") {
        eventbriteFieldMapping = JSON.parse(eventbriteFieldMapping);
    }
    if (typeof mlhFieldMapping === "string") {
        mlhFieldMapping = JSON.parse(mlhFieldMapping);
    }
    if (typeof selectedEmails === "string") {
        selectedEmails = JSON.parse(selectedEmails);
    }

    if (!req.files || !req.files.eventbriteCSV || !req.files.mlhCSV) {
        throw new ApiError(
            400,
            "Both eventbriteCSV and mlhCSV files are required",
        );
    }

    if (!eventbriteFieldMapping || !mlhFieldMapping) {
        throw new ApiError(
            400,
            "Field mappings for both CSV files are required",
        );
    }

    const eventbriteFile = req.files.eventbriteCSV[0];
    const mlhFile = req.files.mlhCSV[0];

    try {
        // Parse CSV files
        const eventbriteData = parse(eventbriteFile.buffer.toString("utf-8"), {
            columns: true,
            skip_empty_lines: true,
        });

        const mlhData = parse(mlhFile.buffer.toString("utf-8"), {
            columns: true,
            skip_empty_lines: true,
        });

        // Build email maps
        const eventbriteMap = new Map();
        const mlhEmails = new Set();

        // Map Eventbrite data using provided field mappings
        eventbriteData.forEach((row) => {
            const email = row[eventbriteFieldMapping.email]
                ?.toLowerCase()
                .trim();
            if (email) {
                eventbriteMap.set(email, {
                    firstName: row[eventbriteFieldMapping.firstName] || "",
                    email: email,
                    githubId: row[eventbriteFieldMapping.githubId] || "",
                });
            }
        });

        // Collect MLH emails using provided field mappings
        mlhData.forEach((row) => {
            const email = row[mlhFieldMapping.email]?.toLowerCase().trim();
            if (email) {
                mlhEmails.add(email);
            }
        });

        console.log("CSV Data Summary:", {
            eventbriteTotal: eventbriteData.length,
            mlhTotal: mlhData.length,
            eventbriteMapSize: eventbriteMap.size,
            mlhEmailsSize: mlhEmails.size,
        });

        // Filter by selected emails if provided, otherwise use common emails
        let emailsToProcess = [];
        if (
            selectedEmails &&
            Array.isArray(selectedEmails) &&
            selectedEmails.length > 0
        ) {
            console.log(
                `Filtering ${selectedEmails.length} selected emails against MLH emails...`,
            );
            emailsToProcess = selectedEmails.filter((email) =>
                mlhEmails.has(email),
            );
            console.log(
                `After MLH filter: ${emailsToProcess.length} emails remain`,
            );
        } else {
            for (const [email] of eventbriteMap) {
                if (mlhEmails.has(email)) {
                    emailsToProcess.push(email);
                }
            }
        }

        // Prepare records for insertion
        const recordsToInsert = [];
        const skippedRecords = [];

        console.log(`Processing ${emailsToProcess.length} emails...`);

        for (const email of emailsToProcess) {
            const userData = eventbriteMap.get(email);
            // Only require email - firstName and githubId can be empty
            if (userData && userData.email) {
                recordsToInsert.push(userData);
            } else {
                skippedRecords.push({
                    email,
                    reason: "missing required fields",
                });
            }
        }

        console.log(
            `Records to insert: ${recordsToInsert.length}, Skipped: ${skippedRecords.length}`,
        );

        // Batch insert users using bulkWrite for optimal performance
        let createdCount = 0;
        let updatedCount = 0;
        const createdUsers = [];
        const errors = [];
        const processedRecords = [];

        // Process records one-by-one with real-time progress tracking
        if (recordsToInsert.length > 0) {
            console.log(
                `Starting sequential processing of ${recordsToInsert.length} records...`,
            );

            for (let index = 0; index < recordsToInsert.length; index++) {
                const userData = recordsToInsert[index];
                const progressPercentage = Math.round(
                    ((index + 1) / recordsToInsert.length) * 100,
                );

                try {
                    console.log(
                        `[${index + 1}/${recordsToInsert.length}] Processing: ${userData.email}`,
                    );

                    // Try to find existing user
                    const existingUser = await User.findOne({
                        email: userData.email,
                    });

                    if (existingUser) {
                        // Update existing user without validation
                        const updatedUser = await User.findByIdAndUpdate(
                            existingUser._id,
                            {
                                firstName: userData.firstName || "",
                                githubId: userData.githubId || "",
                            },
                            { returnDocument: "after", runValidators: false },
                        );

                        updatedCount++;
                        createdUsers.push(updatedUser);

                        console.log(
                            `✓ Updated user: ${userData.email} (${progressPercentage}%)`,
                        );

                        processedRecords.push({
                            email: userData.email,
                            firstName: userData.firstName,
                            githubId: userData.githubId,
                            _id: updatedUser._id,
                            status: "updated",
                            progress: progressPercentage,
                        });
                    } else {
                        // Create new user using insertOne to bypass validation
                        const result = await User.collection.insertOne({
                            firstName: userData.firstName || "",
                            email: userData.email,
                            githubId: userData.githubId || "",
                            messAllowancesLeft: [
                                "Breakfast",
                                "Lunch",
                                "Snack",
                                "Dinner",
                            ],
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        });

                        // Fetch the created user to return complete object
                        const newUser = await User.findById(result.insertedId);

                        createdCount++;
                        createdUsers.push(newUser);

                        console.log(
                            `✓ Created user: ${userData.email} (${progressPercentage}%)`,
                        );

                        processedRecords.push({
                            email: userData.email,
                            firstName: userData.firstName,
                            githubId: userData.githubId,
                            _id: newUser._id,
                            status: "created",
                            progress: progressPercentage,
                        });
                    }
                } catch (error) {
                    console.error(
                        `✗ Error processing ${userData.email}:`,
                        error.message,
                    );

                    errors.push({
                        email: userData.email,
                        error: error.message || "Error creating/updating user",
                    });

                    processedRecords.push({
                        email: userData.email,
                        firstName: userData.firstName,
                        githubId: userData.githubId,
                        status: "error",
                        error: error.message,
                        progress: progressPercentage,
                    });
                }

                // Small delay to prevent database overload
                if (index % 10 === 0) {
                    await new Promise((resolve) => setTimeout(resolve, 50));
                }
            }

            console.log(
                `✓ Batch processing complete: ${createdCount} created, ${updatedCount} updated, ${errors.length} errors`,
            );
        }

        // Return comprehensive report with all processed records
        console.log("Final Response Data:", {
            total: recordsToInsert.length,
            created: createdCount,
            updated: updatedCount,
            errors: errors.length,
            processedRecordsCount: processedRecords.length,
            createdUsersCount: createdUsers.length,
        });

        return res.status(200).json(
            new ApiResponse(200, "CSV processing completed successfully", {
                summary: {
                    total: recordsToInsert.length,
                    created: createdCount,
                    updated: updatedCount,
                    errors: errors.length,
                },
                processedRecords,
                createdUsers,
                errors,
            }),
        );
    } catch (error) {
        throw new ApiError(500, error.message || "Error processing CSV files");
    }
});

// Get Users Count with Aggregation Pipeline
const getUsersCount = asyncHandler(async (req, res) => {
    try {
        const countResult = await User.aggregate([
            {
                $group: {
                    _id: null,
                    totalUsers: { $sum: 1 },
                    uniqueGithubIds: { $addToSet: "$githubId" },
                },
            },
            {
                $project: {
                    _id: 0,
                    totalUsers: 1,
                    uniqueGithubIdsCount: { $size: "$uniqueGithubIds" },
                },
            },
        ]);

        const result = countResult[0] || {
            totalUsers: 0,
            uniqueGithubIdsCount: 0,
        };

        return res.status(200).json(
            new ApiResponse(200, "User count retrieved successfully", {
                totalUsers: result.totalUsers,
                uniqueGithubIds: result.uniqueGithubIdsCount,
            }),
        );
    } catch (error) {
        throw new ApiError(500, error.message || "Error retrieving user count");
    }
});

// Get All Users with Aggregation and Pagination
const getAllUsers = asyncHandler(async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 50;
        const searchQuery = req.query.search || "";
        const skip = (page - 1) * limit;

        // Build match stage for search
        let matchStage = {};
        if (searchQuery) {
            matchStage.$or = [
                { firstName: { $regex: searchQuery, $options: "i" } },
                { email: { $regex: searchQuery, $options: "i" } },
                { githubId: { $regex: searchQuery, $options: "i" } },
            ];
        }

        // Aggregation pipeline
        const users = await User.aggregate([
            { $match: matchStage },
            {
                $project: {
                    _id: 1,
                    firstName: 1,
                    email: 1,
                    githubId: 1,
                    messAllowancesLeft: 1,
                    createdAt: 1,
                    updatedAt: 1,
                },
            },
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit },
        ]);

        // Get total count for pagination
        const countPipeline = [{ $match: matchStage }, { $count: "total" }];
        const countResult = await User.aggregate(countPipeline);
        const total = countResult[0]?.total || 0;

        return res.status(200).json(
            new ApiResponse(200, "Users retrieved successfully", {
                users,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                },
            }),
        );
    } catch (error) {
        throw new ApiError(500, error.message || "Error retrieving users");
    }
});

// Get User Statistics with Aggregation Pipeline
const getUserStatistics = asyncHandler(async (req, res) => {
    try {
        // Get comprehensive statistics
        const stats = await User.aggregate([
            {
                $facet: {
                    // Count total users
                    totalCount: [
                        {
                            $group: {
                                _id: null,
                                count: { $sum: 1 },
                            },
                        },
                    ],
                    // Count by day (for trend analysis)
                    countByDay: [
                        {
                            $group: {
                                _id: {
                                    $dateToString: {
                                        format: "%Y-%m-%d",
                                        date: "$createdAt",
                                    },
                                },
                                count: { $sum: 1 },
                            },
                        },
                        { $sort: { _id: 1 } },
                    ],
                    // Users with complete profile
                    completeProfiles: [
                        {
                            $match: {
                                firstName: { $exists: true, $ne: "" },
                                email: { $exists: true, $ne: "" },
                                githubId: { $exists: true, $ne: "" },
                            },
                        },
                        {
                            $group: {
                                _id: null,
                                count: { $sum: 1 },
                            },
                        },
                    ],
                    // Incomplete profiles
                    incompleteProfiles: [
                        {
                            $match: {
                                $or: [
                                    { firstName: { $exists: false } },
                                    { firstName: "" },
                                    { githubId: { $exists: false } },
                                    { githubId: "" },
                                ],
                            },
                        },
                        {
                            $group: {
                                _id: null,
                                count: { $sum: 1 },
                            },
                        },
                    ],
                },
            },
        ]);

        const result = stats[0];

        return res.status(200).json(
            new ApiResponse(200, "User statistics retrieved successfully", {
                totalUsers: result.totalCount[0]?.count || 0,
                completeProfiles: result.completeProfiles[0]?.count || 0,
                incompleteProfiles: result.incompleteProfiles[0]?.count || 0,
                registrationTrend: result.countByDay,
            }),
        );
    } catch (error) {
        throw new ApiError(500, error.message || "Error retrieving statistics");
    }
});

// Get User by ID
const getUserById = asyncHandler(async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.aggregate([
            { $match: { _id: new require("mongoose").Types.ObjectId(userId) } },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "details",
                },
            },
            { $unwind: "$details" },
            {
                $project: {
                    _id: 1,
                    firstName: 1,
                    email: 1,
                    githubId: 1,
                    messAllowancesLeft: 1,
                    createdAt: 1,
                    updatedAt: 1,
                },
            },
        ]);

        if (!user || user.length === 0) {
            throw new ApiError(404, "User not found");
        }

        return res
            .status(200)
            .json(new ApiResponse(200, "User retrieved successfully", user[0]));
    } catch (error) {
        if (error.message === "User not found") {
            throw error;
        }
        throw new ApiError(500, error.message || "Error retrieving user");
    }
});

// Batch Insert Users with Progress Tracking (Enhanced Version)
const batchInsertUsers = asyncHandler(async (req, res) => {
    const { users } = req.body;

    if (!users || !Array.isArray(users) || users.length === 0) {
        throw new ApiError(
            400,
            "Users array is required and must not be empty",
        );
    }

    if (users.length > 1000) {
        throw new ApiError(
            400,
            "Cannot insert more than 1000 users at once. Please split into smaller batches.",
        );
    }

    try {
        const results = {
            created: [],
            updated: [],
            errors: [],
            summary: {
                total: users.length,
                createdCount: 0,
                updatedCount: 0,
                errorCount: 0,
            },
        };

        // Process users one-by-one without validation
        for (let i = 0; i < users.length; i++) {
            const userData = users[i];

            try {
                const existingUser = await User.findOne({
                    email: userData.email,
                });

                if (existingUser) {
                    // Update existing user without validation
                    const updatedUser = await User.findByIdAndUpdate(
                        existingUser._id,
                        {
                            firstName: userData.firstName || "",
                            githubId: userData.githubId || "",
                        },
                        { returnDocument: "after", runValidators: false },
                    );
                    results.summary.updatedCount++;
                    results.updated.push({
                        email: updatedUser.email,
                        firstName: updatedUser.firstName,
                        githubId: updatedUser.githubId,
                        _id: updatedUser._id,
                    });
                } else {
                    // Create new user using insertOne to bypass validation
                    const result = await User.collection.insertOne({
                        firstName: userData.firstName || "",
                        email: userData.email,
                        githubId: userData.githubId || "",
                        messAllowancesLeft: [
                            "Breakfast",
                            "Lunch",
                            "Snack",
                            "Dinner",
                        ],
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    });
                    const newUser = await User.findById(result.insertedId);
                    results.summary.createdCount++;
                    results.created.push({
                        email: newUser.email,
                        firstName: newUser.firstName,
                        githubId: newUser.githubId,
                        _id: newUser._id,
                    });
                }
            } catch (userError) {
                results.errors.push({
                    email: userData.email,
                    error: userError.message,
                });
                results.summary.errorCount++;
            }
        }

        return res
            .status(200)
            .json(new ApiResponse(200, "Batch insertion completed", results));
    } catch (error) {
        throw new ApiError(500, error.message || "Error in batch insertion");
    }
});

// Process CSV with real-time streaming progress (SSE)
const processCSVWithMappingStream = asyncHandler(async (req, res) => {
    // Parse JSON fields from FormData
    let eventbriteFieldMapping = req.body.eventbriteFieldMapping;
    let mlhFieldMapping = req.body.mlhFieldMapping;
    let selectedEmails = req.body.selectedEmails;

    // Parse stringified JSON if it's a string
    if (typeof eventbriteFieldMapping === "string") {
        eventbriteFieldMapping = JSON.parse(eventbriteFieldMapping);
    }
    if (typeof mlhFieldMapping === "string") {
        mlhFieldMapping = JSON.parse(mlhFieldMapping);
    }
    if (typeof selectedEmails === "string") {
        selectedEmails = JSON.parse(selectedEmails);
    }

    if (!req.files || !req.files.eventbriteCSV || !req.files.mlhCSV) {
        throw new ApiError(
            400,
            "Both eventbriteCSV and mlhCSV files are required",
        );
    }

    if (!eventbriteFieldMapping || !mlhFieldMapping) {
        throw new ApiError(
            400,
            "Field mappings for both CSV files are required",
        );
    }

    // Set SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");

    const eventbriteFile = req.files.eventbriteCSV[0];
    const mlhFile = req.files.mlhCSV[0];

    try {
        // Parse CSV files
        const eventbriteData = parse(eventbriteFile.buffer.toString("utf-8"), {
            columns: true,
            skip_empty_lines: true,
        });

        const mlhData = parse(mlhFile.buffer.toString("utf-8"), {
            columns: true,
            skip_empty_lines: true,
        });

        // Build email maps
        const eventbriteMap = new Map();
        const mlhEmails = new Set();

        // Map Eventbrite data
        eventbriteData.forEach((row) => {
            const email = row[eventbriteFieldMapping.email]
                ?.toLowerCase()
                .trim();
            if (email) {
                eventbriteMap.set(email, {
                    firstName: row[eventbriteFieldMapping.firstName] || "",
                    email: email,
                    githubId: row[eventbriteFieldMapping.githubId] || "",
                });
            }
        });

        // Collect MLH emails
        mlhData.forEach((row) => {
            const email = row[mlhFieldMapping.email]?.toLowerCase().trim();
            if (email) {
                mlhEmails.add(email);
            }
        });

        // Filter by selected emails
        let emailsToProcess = [];
        if (
            selectedEmails &&
            Array.isArray(selectedEmails) &&
            selectedEmails.length > 0
        ) {
            emailsToProcess = selectedEmails.filter((email) =>
                mlhEmails.has(email),
            );
        } else {
            emailsToProcess = Array.from(eventbriteMap.keys()).filter((email) =>
                mlhEmails.has(email),
            );
        }

        // Prepare records
        const recordsToInsert = [];
        for (const email of emailsToProcess) {
            const userData = eventbriteMap.get(email);
            if (userData && userData.email) {
                recordsToInsert.push(userData);
            }
        }

        // Send initial message
        res.write(
            `data: ${JSON.stringify({ type: "start", total: recordsToInsert.length })}\n\n`,
        );

        let createdCount = 0;
        let updatedCount = 0;
        let errorCount = 0;

        // Process records one-by-one
        for (let index = 0; index < recordsToInsert.length; index++) {
            const userData = recordsToInsert[index];
            const progressPercentage = Math.round(
                ((index + 1) / recordsToInsert.length) * 100,
            );

            try {
                // Find existing user
                const existingUser = await User.findOne({
                    email: userData.email,
                });

                let status = "created";
                let user = null;

                if (existingUser) {
                    // Update existing user
                    user = await User.findByIdAndUpdate(
                        existingUser._id,
                        {
                            firstName: userData.firstName || "",
                            githubId: userData.githubId || "",
                        },
                        { returnDocument: "after", runValidators: false },
                    );
                    updatedCount++;
                    status = "updated";
                } else {
                    // Create new user
                    const result = await User.collection.insertOne({
                        firstName: userData.firstName || "",
                        email: userData.email,
                        githubId: userData.githubId || "",
                        messAllowancesLeft: [
                            "Breakfast",
                            "Lunch",
                            "Snack",
                            "Dinner",
                        ],
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    });
                    user = await User.findById(result.insertedId);
                    createdCount++;
                }

                // Send progress update
                res.write(
                    `data: ${JSON.stringify({
                        type: "progress",
                        index: index + 1,
                        total: recordsToInsert.length,
                        percentage: progressPercentage,
                        email: userData.email,
                        status: status,
                        created: createdCount,
                        updated: updatedCount,
                        errors: errorCount,
                    })}\n\n`,
                );
            } catch (error) {
                errorCount++;

                // Send error update
                res.write(
                    `data: ${JSON.stringify({
                        type: "progress",
                        index: index + 1,
                        total: recordsToInsert.length,
                        percentage: Math.round(
                            ((index + 1) / recordsToInsert.length) * 100,
                        ),
                        email: userData.email,
                        status: "error",
                        error: error.message,
                        created: createdCount,
                        updated: updatedCount,
                        errors: errorCount,
                    })}\n\n`,
                );
            }

            // Small delay to prevent database overload
            if (index % 10 === 0) {
                await new Promise((resolve) => setTimeout(resolve, 50));
            }
        }

        // Send completion message
        res.write(
            `data: ${JSON.stringify({
                type: "complete",
                created: createdCount,
                updated: updatedCount,
                errors: errorCount,
                total: recordsToInsert.length,
            })}\n\n`,
        );

        res.end();
    } catch (error) {
        res.write(
            `data: ${JSON.stringify({ type: "error", message: error.message })}\n\n`,
        );
        res.end();
    }
});

export {
    loginAdmin,
    signupAdmin,
    changePassword,
    refreshAccessToken,
    logoutAdmin,
    uploadAndProcessCSV,
    previewCSV,
    processCSVWithMapping,
    processCSVWithMappingStream,
    getUsersCount,
    getAllUsers,
    getUserStatistics,
    getUserById,
    batchInsertUsers,
};
