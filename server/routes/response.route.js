import { Router } from "express";
import { geminiResponse } from "../controllers/gemini.controller.js";

const responseRouter = Router();

// route for google gemini response
responseRouter.route("/response").post(geminiResponse);

export { responseRouter };
