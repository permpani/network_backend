import express from "express";
import mongoose from "mongoose";
import Chat from "../models/chat.model.js";
import User from "../models/user.model.js";

export const createChat = async (req, res, next) => {
  try {
    const {allowedUsers, matchID} = req.body;
    const chat = new Chat({name: "", allowedUsers, matchID});
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
