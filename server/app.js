import express, { urlencoded } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security headers middleware
app.use((req, res, next) => {
    // Prevent MIME type sniffing
    res.setHeader("X-Content-Type-Options", "nosniff");

    // Prevent clickjacking
    res.setHeader("X-Frame-Options", "SAMEORIGIN");

    // Enable XSS protection
    res.setHeader("X-XSS-Protection", "1; mode=block");

    // Referrer policy to prevent credential leakage
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

    // Permissions policy
    res.setHeader(
        "Permissions-Policy",
        "geolocation=(), microphone=(), camera=()",
    );

    // Cache control to prevent caching sensitive data
    if (req.path.includes("/admin") || req.path.includes("/api")) {
        res.setHeader(
            "Cache-Control",
            "no-store, no-cache, must-revalidate, proxy-revalidate",
        );
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");
    }

    next();
});

app.use(
    cors({
        origin: process.env.CORS_ORIGIN || "http://localhost:3000",
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization"],
    }),
);

app.use(urlencoded({ extended: true, limit: "10kb" }));

app.use(express.json({ limit: "10kb" }));

app.use(express.static("public"));

app.use(cookieParser());

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "public", "pages", "home.html"));
});

app.get("/admin", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "public", "pages", "admin.html"));
});

// gemini response route
import responseRouter from "./routes/response.route.js";
// health check route
import healthCheck from "./routes/health.route.js";
// admin auth routes
import adminRouter from "./routes/admin.route.js";

app.use("/api/v1/chatbot", responseRouter);

app.use("/api/v1/check", healthCheck);

app.use("/api/v1/auth/admin", adminRouter);

app.all(/(.*)/, (req, res) => {
    res.status(404).sendFile(
        path.join(__dirname, "..", "public", "pages", "404.html"),
    );
});

export default app;
