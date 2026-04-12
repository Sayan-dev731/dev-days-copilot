import { Router } from "express";
import multer from "multer";
import {
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
} from "../controllers/admin.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        // Accept CSV files only
        if (
            file.mimetype === "text/csv" ||
            file.mimetype === "application/vnd.ms-excel"
        ) {
            cb(null, true);
        } else {
            cb(new Error("Only CSV files are allowed"));
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
});

// Public routes
router.route("/login").post(loginAdmin);
router.route("/signup").post(signupAdmin);
router.route("/refresh-token").post(refreshAccessToken);

// Protected routes
router.route("/change-password").post(verifyJWT, changePassword);
router.route("/logout").post(verifyJWT, logoutAdmin);
router.route("/upload-csv").post(
    verifyJWT,
    upload.fields([
        { name: "eventbriteCSV", maxCount: 1 },
        { name: "mlhCSV", maxCount: 1 },
    ]),
    uploadAndProcessCSV,
);

// CSV Preview and Processing with field mapping
router.route("/preview-csv").post(
    verifyJWT,
    upload.fields([
        { name: "eventbriteCSV", maxCount: 1 },
        { name: "mlhCSV", maxCount: 1 },
    ]),
    previewCSV,
);

router.route("/process-csv-mapped").post(
    verifyJWT,
    upload.fields([
        { name: "eventbriteCSV", maxCount: 1 },
        { name: "mlhCSV", maxCount: 1 },
    ]),
    processCSVWithMapping,
);

// CSV Processing with real-time streaming (Server-Sent Events)
router.route("/process-csv-stream").post(
    verifyJWT,
    upload.fields([
        { name: "eventbriteCSV", maxCount: 1 },
        { name: "mlhCSV", maxCount: 1 },
    ]),
    processCSVWithMappingStream,
);

// ============ USER MANAGEMENT ROUTES ============
// Get total users count with aggregation
router.route("/users/count").get(verifyJWT, getUsersCount);

// Get all users with pagination and search
router.route("/users").get(verifyJWT, getAllUsers);

// Get user statistics with aggregation pipelines
router.route("/users/statistics").get(verifyJWT, getUserStatistics);

// Get specific user by ID
router.route("/users/:userId").get(verifyJWT, getUserById);

// Batch insert users
router.route("/users/batch-insert").post(verifyJWT, batchInsertUsers);

export default router;
