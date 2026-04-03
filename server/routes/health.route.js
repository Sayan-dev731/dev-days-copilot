import { Router } from "express";
import { healthCheck } from "../controllers/health.controller.js";

const healthRouter = Router();

healthRouter.route("/health").get(healthCheck);

export {healthRouter};