import express from "express";
import {
  createUser,
  localLogin,
  logout,
  getNavbarInfo,
  checkLogin,
  addUserInfo,
  getUserInfo,
  toggleStatus,
  getUsersBySearch,
  getAllChat,
} from "../controllers/user.controller.js";
const router = express.Router();

router
  .route("/user")
  .post(createUser)

router.route("/user/login").post(localLogin); // login

router
  .route("/user/info")
  .post(getUserInfo)
  
router.route("/user/logout").post(logout); // logout

router.route("/user/navbar").get(getNavbarInfo); // get navbar info


router.route("/user/check-login").get(checkLogin); // check if user login

router
  .route("/api/user/chatRooms/:userId")
  .get(getAllChat);

export default router;
