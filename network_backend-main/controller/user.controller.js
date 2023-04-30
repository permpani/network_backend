import passport from "passport";
import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import express from "express";
import csrf from "csrf";
import dotenv from "dotenv";
import {localStrategy} from "../configs/passport.config.js";
import {upload} from "../middlewares/image.middleware.js";

dotenv.config({path: ".env"});
const secret = process.env.JWT_SECRET;
const csrfProtection = new csrf();

export const createUser = (req, res, next) => {
  const user = new User();
  user.username = req.body.user.username;
  user.email = req.body.user.email;
  user.setPassword(req.body.user.password);

  user
    .save()
    .then(function () {
      return res.json({message: "Create account successfully"});
    })
    .catch(function (error) {
      if (error.code === 11000) {
        console.log(error);
        return res
          .status(400)
          .send({error: "Username or E-mail already exists"});
      }
      next(error);
    });
};

export const localLogin = (req, res, next) => {
  passport.use(localStrategy);
  if (!req.body.user.email) {
    return res.status(422).json({errors: {email: "can't be blank"}});
  }
  if (!req.body.user.password) {
    return res.status(422).json({errors: {password: "can't be blank"}});
  }
  passport.authenticate("local", function (err, user, info) {
    if (err) {
      return next(err);
    }
    if (user) {
      user.token = user.generateJWT();
      const cookieData = user.toAuthJSON();

      res.cookie("auth", cookieData, {
        httpOnly: true,
        sameSite: "none",
        secure: true,
        expires: 0,
        path: "/",
        // domain: "monkeydcar.website",
      });

      res.header(user.getIdJSON()).send("Login success");
    } else {
      return res.status(422).json(info);
    }
  })(req, res, next);
};

export const getAllUsers = async (req, res, next) => {
  try {
    let users = await User.find();
    // if (user == null) {
    //   res.status(404).json({message: "Cannot find user"});
    // } else {
    //   res.send(await user.getUserInfoJSON());
    // }
    res.send(users);
  } catch (error) {
    res.status(500).json({message: error.message});
  }
};

export const logout = async (req, res, next) => {
  const cookie_name = req.body.cookie_name;
  res.clearCookie(cookie_name, {
    path: "/",
  });
  res.clearCookie(cookie_name, {
    path: "/",
  });
  res.status(200).send("logout successfully");
};

export const getNavbarInfo = async (req, res, next) => {
  try {
    const user = await User.findOne({_id: req.headers.user_id});
    return res.json(user);
  } catch (err) {
    return res.status(500).json({message: err.message});
  }
};

export const getAllChat = async (req, res, next) => {
  const userId = req.params.userId;
  try {
    const user = await User.findById(userId).populate({
      path: "chatRooms",
      populate: {path: "matchID", populate: {path: "carID"}},
    });
    if (!user) {
      return res.status(404).json({error: "User not found"});
    }
    let chats = user.chatRooms;
    for (let chat of chats) {
      const peer = chat.allowedUsers.find((id) => !id.equals(userId));
      let peerUsername = await User.findById(peer, {username: 1});
      chat.name = peerUsername.username;
    }
    res.json({chats});
  } catch (error) {
    res.status(500).json({error: "An error occurred while getting chat rooms"});
  }
};

