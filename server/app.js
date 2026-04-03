import express, { urlencoded } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(
    cors({
        origin: process.env.CORS_ORIGIN || "*",
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE"],
    }),
);

app.use(urlencoded({ extended: true, limit: "10kb" }));

app.use(express.json({ limit: "10kb" }));

app.use(express.static("public"));

app.use(cookieParser());

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "public", "pages", "home.html"));
});

// app.use((req, res) => {
//     res.sendFile(path.join(__dirname, "..", "public", "pages", "404.html"));
// });

// gemini response route
import { responseRouter } from "./routes/response.route.js";

app.use("/api/v1/chatbot", responseRouter);

// health check route
import { healthCheck } from "./controllers/health.controller.js";

app.use("/api/v1/check", healthCheck);

export default app;
