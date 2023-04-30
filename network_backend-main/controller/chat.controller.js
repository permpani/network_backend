import express from "express";
import mongoose from "mongoose";
import Chat from "../models/chat.model.js";
import User from "../models/user.model.js";

export const createChat = async (req, res, next) => {
  try {
    const {allowedUsers,nameChat} = req.body;
    const chat = new Chat({nameChat, allowedUsers});
    await chat.save();
    // Add the new room to all allowed users' chatRooms
    await User.updateMany(
      {_id: {$in: allowedUsers}},
      {$addToSet: {chatRooms: chat._id}}
    );
    res.status(201).json({message: "Chat created successfully."});
  } catch (error) {
    res.status(500).json({error: error.message});
  }
};

export const showGroupMember = async (req, res, next) => {
  const chatId = req.params.chatId;
  try {
    const chat = await Chat.findById(chatId).populate({
      path: "allowedUsers"
    });
    if (!chat) {
      return res.status(404).json({error: "Chat not found"});
    }
    const usernames = chat.allowedUsers.map(user => user.username);
    return res.status(200).json({ usernames });
  } catch (error) {
    res.status(500).json({error: "An error occurred while getting chat rooms"});
  }
};  
export const getAllChatRoomInServer = async (req, res, next) => {
  const typeRoom = req.query.typeRoom;
  let condition = {};
  condition.typeRoom = typeRoom;
  try {
    let chats = await Chat.find(condition);
    res.send(chats);
  } catch (error) {
    res.status(500).json({message: error.message});
  }
};

export const joinChat = async (req, res, next) => {
  const user_id = req.header.user_id;
  const chat_id = req.header.chat_id;
  try {
    await Chat.findOneAndUpdate(
      {_id: chat_id},
      {$addToSet: {allowedUsers: user_id}},
      {new: true}
    );
    await User.findOneAndUpdate(
      {_id: user_id},
      {$addToSet: {chatRooms: chat_id}},
      {new: true}
    );
    res.send("Join chat successfully");
  } catch (error) {
    res.status(500).json({message: error.message});
  }
};
