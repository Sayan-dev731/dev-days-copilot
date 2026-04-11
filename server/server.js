import app from "./app.js";
import dotenv from "dotenv";
import connectDb from "./db/connectDb.js";
dotenv.config({
    path: "./.env",
});

const PORT = process.env.PORT || 3001;

connectDb()
    .then(() => {
        app.listen(PORT, () => {
            console.log(
                `Server is running on the link http://localhost:${PORT}`,
            );
        });
    })
    .catch((err) => {
        console.error("Failed to connect to the database", err);
    });
