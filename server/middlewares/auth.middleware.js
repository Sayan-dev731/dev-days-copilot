import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Admin } from "../models/admin.model.js";

const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        const token =
            req.cookies?.accessToken ||
            req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            throw new ApiError(401, "Unauthorized request");
        }

        let decodedToken;
        try {
            decodedToken = jwt.verify(
                token,
                process.env.JWT_ACCESS_TOKEN_SECRET,
            );
        } catch (error) {
            if (error.name === "TokenExpiredError") {
                throw new ApiError(401, "Access token has expired");
            }
            throw new ApiError(401, "Invalid access token");
        }

        const admin = await Admin.findById(decodedToken?.id).select(
            "-password",
        );

        if (!admin) {
            throw new ApiError(401, "Invalid access token");
        }

        req.admin = admin;
        next();
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token");
    }
});

export { verifyJWT };
