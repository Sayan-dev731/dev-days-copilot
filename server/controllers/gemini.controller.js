import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

const ai = new GoogleGenAI({
    apiKey: process.env?.GEMINI_API_KEY,
});

// console.log(process.env.GEMINI_API_KEY);

const geminiResponse = asyncHandler(async (req, res) => {
    const { varStack, varTheme } = req.body;

    if (!(varStack && varTheme)) {
        throw new ApiError(
            400,
            "Stack and theme are required in the request body",
        );
    }

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3.1-flash-lite-preview",
            contents: `Act as an AI system architect and MLH hackathon mentor. Generate a highly technical, feasible hackathon project idea.
          Tech Stack: '${varStack}'
          Domain/Theme: '${varTheme}'
          
          Output format must be plain text mimicking a raw terminal output. Do NOT use markdown formatting.
          Structure strictly as follows:
          
          [CODENAME] <creative, tech-sounding name>
          [PITCH] <1-2 sentences explaining the core value>
          [ARCHITECTURE]
          > <Technical feature 1>
          > <Technical feature 2>
          > <Technical feature 3>
          
          Keep it under 150 words. Be highly specific to the provided tech stack.`,
        });

        res.status(200).json(
            new ApiResponse(
                200,
                "Successfully Generated the Response.",
                response,
            ),
        );
        return response;
    } catch (err) {
        throw new ApiError(500, "Failed to generate response from Gemini API.");
    }
});

export { geminiResponse };
