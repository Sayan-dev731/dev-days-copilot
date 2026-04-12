import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
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
    validateUserEmail,
} from "../controllers/users.controller.js";

const router = Router();

// Public route - no authentication required
router.post("/validate-email", validateUserEmail);

// All routes below require JWT authentication from admin
router.use(verifyJWT);

// Get user statistics (must be before :userId to avoid conflict)
router.get("/stats", getUserStats);

// Get user by QR code (for scanning)
router.post("/qr-scan", getUserByQRCode);

// Remove meal allowance (when scanned)
router.post("/meal/remove", removeMealAllowance);

// Bulk import users
router.post("/bulk/import", bulkImportUsers);

// Get all users
router.get("/", getAllUsers);

// Add new user
router.post("/add", addUser);

// Get user by ID
router.get("/:userId", getUserById);

// Update user
router.put("/:userId", updateUser);

// Delete user
router.delete("/:userId", deleteUser);

// Reset meal allowances for user
router.post("/:userId/reset-meals", resetMealAllowances);

export default router;
