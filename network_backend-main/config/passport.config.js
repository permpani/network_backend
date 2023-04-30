import passport from "passport";
import {Strategy as LocalStrategy} from "passport-local";
import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../models/user.model.js";

dotenv.config({path: ".env"});

export const localStrategy = new LocalStrategy(
  {
    usernameField: "user[username]",
  },
  function (username, done) {
    User.findOne({username: username})
      .then(function (user) {
        if (!user) {
          return done(null, false, {
            error: "username is invalid",
          });
        }
        return done(null, user);
      })
      .catch(done);
  }
);
