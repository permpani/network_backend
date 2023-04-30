import express from "express";
import {createChat, getChatRoomUserHave, getChatRoomDM, showGroupMember, getAllChatRoomInServer, haveChat, joinChat} from "../controllers/chat.controller.js";
const router = express.Router();

router.route("/chat/create").post(createChat);
//router.route("/chat/have").get(getChatRoomUserHave);
router.route("/chat/DM").get(getChatRoomDM); //หรือpost (may create new chat)
router.route("/chat/member").get(showGroupMember);
router.route("/chat/all").get(getAllChatRoomInServer);
router.route("/chat/have").get(haveChat);
router.route("/chat/join").post(joinChat);
export default router;
