import mongoose from "mongoose";
import findOrCreate from "mongoose-findorcreate";
import crypto from "crypto";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import {getImageUrl} from "../utils/gcs.utils.js";

dotenv.config({path: ".env"});

const secret = process.env.JWT_SECRET;

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      lowercase: true,
      unique: true,
      required: [true, "can't be blank"],
      match: [
        /^(?=.{1,20}$)(?![_.])(?!.*[_.]{2})[a-zA-Z0-9._]+(?<![_.])$/,
        "is invalid",
      ],
      index: true,
    },
    chatRooms: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Chat",
      },
    ],
  },
  {timestamps: true}
);
UserSchema.plugin(findOrCreate);

UserSchema.methods.generateJWT = function () {
  var today = new Date();
  var exp = new Date(today);
  exp.setDate(today.getDate() + 60);

  return jwt.sign(
    {
      id: this._id,
      username: this.username,
      exp: parseInt(exp.getTime() / 1000),
    },
    secret
  );
};

UserSchema.methods.toAuthJSON = function () {
  return this.generateJWT();
};

UserSchema.methods.getIdJSON = function () {
  return {
    user_id: this._id,
    username: this.username,
  };
};


const User = mongoose.model("User", UserSchema);
export default User;
