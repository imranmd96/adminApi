const formidableMiddleware = require('express-formidable');
const adminRouter=require("express").Router();
const session = require('express-session')
const dev = require('../config/env.config');
const adminController = require('../controller/admin.controller ');
const auth = require('../middelwares/auth');
const upload = require('../helper/multer');

adminRouter.use(session({
    secret: dev.app.sessionSecretKey,
    name:"admin_session",
    resave: false,
    saveUninitialized: true,
    cookie: { 
      secure: false,
      maxAge:10*6000,
      httpOnly : true,
      sameSite:"none",
    }
  }))

  adminRouter.post("/register-admin",upload.single("image"),auth.isLoggedOut,adminController.adminRegistration)
  adminRouter.post("/verify-email",upload.none(),auth.isLoggedOut,adminController.emailVerification)

  adminRouter.post("/login",auth.isLoggedOut,upload.none(),adminController.loginAdmin)
  adminRouter.get("/logout",auth.isLoggedIn,adminController.logoutAdmin)

  // adminRouter.post("/forget-password",isLoggedOut,formidableMiddleware(),forgetPassword)
  // adminRouter.post("/reset-password",isLoggedOut,formidableMiddleware(),resetPassword)


  adminRouter.get("/dashbaord",auth.isLoggedIn,auth.isAdmin,adminController.displayAllUsersLists)
  adminRouter.post("/dashbaord",auth.isLoggedIn,auth.isAdmin,adminController.createUserByAdmin)
  adminRouter.put("/dashbaord/:id",upload.single("image"),auth.isLoggedIn,auth.isAdmin,adminController.updateUserByAdmin)
  adminRouter.delete("/dashbaord/:id",auth.isLoggedIn,auth.isAdmin,adminController.deleteUserByAdmin)
  adminRouter.get("/dashbaord/export-excel-data",adminController.exportExcelData)

  // adminRouter.get("/",isLoggedIn,formidableMiddleware(),userProfile)
  // adminRouter.delete("/",isLoggedIn,formidableMiddleware(),deleteUser)
  // adminRouter.put("/",isLoggedIn,formidableMiddleware(),updateAdmin)

module.exports=adminRouter;

