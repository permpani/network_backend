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

export const getAllChatInServer = async (req, res, next) => {
  try {
    let chats = await Chat.find();
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