const userRouter=require("express").Router();
const session = require('express-session')

const { registerUser, verifyEmail, loginUser, logoutUser, userProfile, deleteUser, updateUser, forgetPassword, resetPassword } = require("../controller/user.controller");
const dev = require('../config/env.config');
const { isLoggedIn, isLoggedOut } = require('../middelwares/auth');
const  upload  = require('../helper/multer');

userRouter.use(session({
    secret: dev.app.sessionSecretKey,
    name:"user_session",
    resave: false,
    saveUninitialized: true,
    cookie: {
       secure: false,
       maxAge:10*6000,
       httpOnly : true,
       sameSite:"none",
      }
  }))

userRouter.post("/register-user",upload.single("image"),registerUser)
userRouter.post("/verify-email",upload.none(),verifyEmail)
userRouter.post("/login",isLoggedOut,upload.none(),loginUser)
userRouter.get("/logout",isLoggedIn,logoutUser)
userRouter.get("/",isLoggedIn,userProfile)
userRouter.delete("/",isLoggedIn,deleteUser)
userRouter.put("/",isLoggedIn,upload.single("image"),updateUser)
userRouter.post("/forget-password",isLoggedOut,upload.none(),forgetPassword)
userRouter.post("/reset-password",isLoggedOut,upload.none(),resetPassword)



module.exports=userRouter;

