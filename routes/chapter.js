import { Router } from "express";
import { is_admin, logedin } from "../middleware/authorisation.js";
import {
  createChapter,
  getChapter,
  deleteChapter,
} from "../controllers/chapter.js";
import uploads from "../middleware/uploads.js";

const router = Router();

router.post(
  "/add-chapter",
  is_admin,
  uploads.array("photos", 100),
  createChapter
);

router.get("/get-chapter/:chapterId", logedin, getChapter);

router.delete("/delete-chapter/:chapterId", is_admin, deleteChapter);

export default router;
