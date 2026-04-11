import { Router } from "express";
import { geminiResponse } from "../controllers/gemini.controller.js";

const router = Router();

// route for google gemini response
router.route("/response").post(geminiResponse);

export default router;
