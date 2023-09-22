const UserModel = require("../model/users.model");
const createError = require('http-errors');


const isLoggedIn=async (req,res,next)=>{
  const userId=req.session.userId;
  const token = req.cookies.user_session
    try {
      if (userId || token) {
        const user=await UserModel.findById({_id:userId})
        req.user=user;
        next();
      } else {
        return res.status (400).json({ message: 'please login' });
      }
    } catch (error) {
        next(error);
    }
}

const isLoggedOut=async (req,res,next)=>{
  const userId=req.session.userId;
    try {
      if (userId) {
        return res.status (400).json({ message: 'please logout first' });
      } 
    next();
     
    } catch (error) {
        next(error);
    }
}





const isAdmin= async (req,res,next)=>{
  console.log(req.user.is_admin)
  try {
    if (req.user.is_admin==1) {
      next()
    } else {
     
       throw createError(403,'Forbiden. you must be an admin' )

    }
  } catch (error) {
    next(error);
  }
}

const auth={isLoggedIn,isLoggedOut,isAdmin};


module.exports=auth;