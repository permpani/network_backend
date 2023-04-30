import express from "express";
import {createChat, toggleNotiChat} from "../controllers/chat.controller.js";
const router = express.Router();

router.route("/chat").post(createChat);
router.route("/chat/noti").patch(toggleNotiChat);
export default router;
