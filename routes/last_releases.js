import { Router } from "express";
import { query } from "express-validator";
import { lastReleases } from "../controllers/last_releases.js";
import { error_validation } from "../middleware/error_validation.js";
const router = Router();

router.get(
  "/",
  query("page", "please send and integer").default(1).isInt({ min: 1 }),
  error_validation,
  lastReleases
);

export default router;
