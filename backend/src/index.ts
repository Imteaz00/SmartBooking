import express, { Request, Response } from "express";
import { ENV } from "./config/env.js";
import cors from "cors";
import routers from "./router.js";

const app = express();

if (!ENV.frontend_url) {
  throw new Error("Frontend Url is missing.");
}

app.use(cors({ origin: ENV.frontend_url }));
app.use(express.json());

app.use("/api", routers);

app.listen(ENV.port, () => console.log(`Server is running on port ${ENV.port}`));
