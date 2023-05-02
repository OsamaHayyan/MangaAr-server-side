import { Router } from "express";
import { body, query } from "express-validator";
import bcrypt from "bcryptjs";
import {
  signup,
  login,
  logout,
  sendResetPwToken,
  checkToken,
  resetPassword,
  editeUser,
  editePassword,
  getAllUsers,
  addAdmin,
  deleteUser,
  removeAdmin,
  getRecent,
  addFavorite,
  deleteFavorite,
  getUser,
} from "../controllers/user.js";
import {
  error_validation,
  signup_validation,
  editeuser_validation,
} from "../middleware/error_validation.js";
import {
  is_superuser,
  is_auth,
  noLogedIn,
} from "../middleware/authorisation.js";
import uploads from "../middleware/uploads.js";
import User from "../models/user.js";

const router = Router();

router.get("/user", is_auth, getUser);

router.post(
  "/signup",
  uploads.single("profile_photo"),
  signup_validation,
  signup
);

router.post(
  "/login",
  [
    body("email")
      .isEmail()
      .withMessage("Please enter a valid email.")
      .normalizeEmail()
      .bail()
      .custom(async (value, { req }) => {
        const email = await User.exists({ email: value });
        if (!email) {
          throw new Error(`Email or Password isn't valied`);
        }
        return true;
      }),
    error_validation,
    body("password", `Email or Password isn't valied`)
      .isStrongPassword({
        minUppercase: 0,
      })
      .bail()
      .custom(async (password, { req }) => {
        const email = req.body.email;
        const user = await User.findOne({ email: email })
          .select("password -_id")
          .lean();

        const isEqual = await bcrypt.compare(password, user.password);
        if (!isEqual) {
          throw new Error("Email or Password isn't valied");
        }
        return true;
      }),
  ],
  error_validation,
  login
);

router.get("/logout", is_auth, logout);

router.post(
  "/send-reset-token",
  noLogedIn,
  body("email")
    .isEmail()
    .withMessage("Please enter a valid email.")
    .normalizeEmail()
    .bail()
    .custom(async (value, { req }) => {
      const email = await User.exists({ email: value });
      if (!email) {
        throw new Error(`Email doesn't exist`);
      }
      return true;
    }),
  error_validation,
  sendResetPwToken
);

router.post("/check-token", noLogedIn, checkToken);

router.post(
  "/reset-password",
  noLogedIn,
  [
    body("email")
      .isEmail()
      .withMessage("Please enter a valid email.")
      .normalizeEmail(),
    body(
      "password",
      "The Password should contain numbers, characters and symbols with at least 8 char length"
    ).isStrongPassword({ minUppercase: 0 }),
    body("confirm").custom((value, { req }) => {
      const password = req.body.password;
      if (value != password) {
        throw new Error("password confirmation is wrong");
      }
      return true;
    }),
  ],
  error_validation,
  resetPassword
);

router.post(
  "/edite-user",
  is_auth,
  uploads.single("edite_profile_photo"),
  editeuser_validation,
  editeUser
);

router.post(
  "/edite-password",
  is_auth,
  [
    body(
      "password",
      "The Password should contain numbers, characters and symbols with at least 8 char length"
    ).isStrongPassword({ minUppercase: 0 }),
    body("confirm").custom(async (value, { req }) => {
      const password = req.body.password;
      if (value != password) {
        throw new Error("password confirmation is wrong");
      }

      const oldPw = req.body.oldpassword;
      const user = await User.findById(req.user.userId)
        .select("password -_id")
        .lean();

      const password_check = await bcrypt.compare(oldPw, user.password);
      if (!password_check) {
        const message = "password isn't correct";
        throw new Error(message);
      }
      return true;
    }),
  ],
  error_validation,
  editePassword
);

router.get(
  "/users",
  is_superuser,
  query("page", "please send and integer").default(1).isInt({ min: 1 }),
  error_validation,
  getAllUsers
);

router.get("/recent", is_auth, getRecent);

router.post("/favorite/:mangaId", is_auth, addFavorite);

router.delete("/favorite/:mangaId", is_auth, deleteFavorite);

router.post(
  "/add-admin",
  is_superuser,
  body("userId", "Please add a valid User").isMongoId(),
  error_validation,
  addAdmin
);

router.post(
  "/remove-admin",
  is_superuser,
  body("userId", "Please add a valid User").isMongoId(),
  error_validation,
  removeAdmin
);

router.delete(
  "/delete-user",
  is_superuser,
  body("userId", "Please add a valid User")
    .isMongoId()
    .bail()
    .custom(async (userId, { req }) => {
      const isSuperUser = await User.exists({ _id: userId, superuser: true });
      if (isSuperUser) {
        const message = "This user can't be removed";
        throw new Error(message);
      }
      return true;
    }),
  error_validation,
  deleteUser
);

export default router;
