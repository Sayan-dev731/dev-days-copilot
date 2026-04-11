import { Router } from "express";
import {
    loginAdmin,
    signupAdmin,
    changePassword,
    refreshAccessToken,
    logoutAdmin,
} from "../controllers/admin.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Public routes
router.route("/login").post(loginAdmin);
router.route("/signup").post(signupAdmin);
router.route("/refresh-token").post(refreshAccessToken);

// Protected routes
router.route("/change-password").post(verifyJWT, changePassword);
router.route("/logout").post(verifyJWT, logoutAdmin);

export default router;
