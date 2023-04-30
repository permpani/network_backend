import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import express from "express";
import csrf from "csrf";
import dotenv from "dotenv";

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
        domain: "monkeydcar.website",
      });

      res.header(user.getIdJSON()).send("Login success");
    } else {
      return res.status(422).json(info);
    }
  })(req, res, next);
};

export const addUserInfo = async (req, res, next) => {
  const id = req.body.id;
  try {
    let user = await User.findById(id);
    if (user == null) {
      res.status(404).json({message: "Cannot find user"});
    } else {
      const imageUri = req.file
        ? await uploadImage(req.file, process.env.GCS_PROFILE_BUCKET, null, id)
        : null;
      if (req.body.username) user.username = req.body.username;
      if (imageUri) user.image = imageUri;
      if (req.body.owncars) user.owncars = req.body.owncars;
      if (req.body.firstName) user.firstName = req.body.firstName;
      if (req.body.lastName) user.lastName = req.body.lastName;
      if (req.body.phoneNumber) user.phoneNumber = req.body.phoneNumber;
      if (req.body.prefix) user.prefix = req.body.prefix;
      if (req.body.IDCardNumber) user.IDCardNumber = req.body.IDCardNumber;
      if (req.body.drivingLicenseNumber)
        user.drivingLicenseNumber = req.body.drivingLicenseNumber;
      user
        .save()
        .then(function () {
          return res.send("Complete!");
        })
        .catch(function (error) {
          if (error.code === 11000) {
            return res.status(400).send({error: "Username already exists"});
          }
          next(error);
        });
    }
  } catch (error) {
    res.status(500).json({message: error.message});
  }
};

export const getUserInfo = async (req, res, next) => {
  const id = req.body.id;
  try {
    let user = await User.findById(id);
    if (user == null) {
      res.status(404).json({message: "Cannot find user"});
    } else {
      res.send(await user.getUserInfoJSON());
    }
  } catch (error) {
    res.status(500).json({message: error.message});
  }
};

export const logout = async (req, res, next) => {
  const cookie_name = req.body.cookie_name;
  res.clearCookie(cookie_name, {
    path: "/",
    domain: "monkeydcar.website",
  });
  res.clearCookie(cookie_name, {
    path: "/",
    domain: "service.monkeydcar.website",
  });
  res.status(200).send("logout successfully");
};

export const forgotPassword = async (req, res, next) => {
  const {email} = req.body;
  try {
    const user = await User.findOne({email: email}, {_id: 1, username: 1});
    if (user) {
      const token = jwt.sign({userId: user._id}, secret, {expiresIn: "1h"});
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.MONKEY_EMAIL_ADR,
          pass: process.env.MONKEY_EMAIL_PWD,
        },
      });

      const mailOptions = {
        from: `Monkey D Car Rent <${process.env.MONKEY_EMAIL_ADR}>`,
        to: email,
        subject: "Password reset instructions",
        html: `<p>Hi ${user.username},</p>
           <p>Click <a href="${process.env.FRONTEND_PORT}/resetPassword?token=${token}">here</a> to reset your password.</p>
           <p>This link will expire in 1 hour.</p>`,
      };
      transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
          console.log(err);
          return res.status(500).json({message: "Internal server error"});
        }
        return res
          .status(200)
          .json({message: "Password reset instructions sent"});
      });
    } else {
      return res.status(404).json({message: "User not found"});
    }
  } catch (err) {
    return res.status(500).json({message: err.message});
  }
};

export const resetPassword = async (req, res, next) => {
  const token = req.body.token;
  const password = req.body.password;

  try {
    const decoded = jwt.verify(token, secret);
    const userId = decoded.userId;

    User.findById(userId, (err, user) => {
      if (err) {
        return res.status(500).json({message: "Internal server error"});
      }
      if (!user) {
        return res.status(404).json({message: "User not found"});
      }
      user.setPassword(password);
      user.save((err, updatedUser) => {
        if (err) {
          return res.status(500).json({message: "Internal server error"});
        }
        res.status(200).json({message: "Password reset successfully"});
      });
    });
  } catch (error) {}
};

export const getNavbarInfo = async (req, res, next) => {
  try {
    const user = await User.findOne({_id: req.headers.user_id});
    return res.json({user: await user.getNavbarInfoJSON()});
  } catch (err) {
    return res.status(500).json({message: err.message});
  }
};


export const checkLogin = async (req, res, next) => {
  return res.status(200).json({isLogin: true});
};

export const getUserRole = async (req, res, next) => {
  const id = req.body.id;
  try {
    let user = await User.findById(id);
    if (user == null) {
      res.status(404).json({message: "Cannot find user"});
    } else {
      res.send({
        userRole: user.role,
      });
    }
  } catch (error) {
    res.status(500).json({message: error.message});
  }
};

export const toggleStatus = async (req, res, next) => {
  const user_id = req.body.user_id;
  const action = req.body.action;
  let user;
  try {
    user = await User.findById(user_id);
    if (user == null) {
      return res.status(404).json({message: "Cannot find user"});
    }
  } catch (err) {
    console.log(err.message);
    return res.status(500).json({message: err.message});
  }
  if (user.status == "Unverified") {
    if (action == "Approve") {
      user.status = "Verified";
      if (user.requestTobeLessor) {
        user.role = "lessor";
        const notification = new Notification();
        notification.userID = user_id;
        notification.text =
          "You are now a lessor. You can add your first car now.";
        notification.save();
      }
    } else if (action == "Reject") {
      user.status = "Rejected";
    }
  } else if (user.status == "Rejected") {
    if (action == "Approve") {
      user.status = "Verified";
    } else return res.json({message: "No Action can be taken"});
  } else {
    return res.json({message: "No Action can be taken"});
  }
  await user.save();
  if (action == "Approve") {
    let query = {renterID: user_id};
    try {
      let matches = await Match.find(query);
      console.log(matches);
      for (const match of matches) {
        if (match.status == "Unverified renter") {
          match.status = "Wait for payment";
        }
        await match.save();
      }
    } catch (error) {
      console.error(error);
    }
  }
  res.send("User and Match status has been updated");
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

export const getCSRF = async (req, res, next) => {
  const token = csrfProtection.create(secret);
  res.cookie("csrf-token", token, {
    httpOnly: true,
    sameSite: "none",
    secure: true,
    path: "/",
  });
  res.json({token});
};
