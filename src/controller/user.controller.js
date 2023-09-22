const jwt = require('jsonwebtoken');

const UserModel = require("../model/users.model")
const inputValidateRules = require("../validator /input.validator")
const { encriptedPassword, comparePassword } = require("../validator /securePassword");
const dev = require('../config/env.config');
const { sendEmailWithNodeMailer } = require('../helper/email');

const registerUser=async (req,res)=>{
try {
    const {name,email,password,phone} = req.body
    const image=req.file;

    
    inputValidateRules(name, email,password, phone,res)

    if(password.length <6){
        return res.status(404).json({
            message:"minimum length for password is 6"
        })
    }
     // if(image && image.size >Math.pow(1024,2))
    if(image && image.size >10000000){
        return res.status(400).json({
            message:"maximum length for image  is 1 Mb"
        })
    }
 const isExist = await UserModel.findOne({email})
    if(isExist){
        return res.status(404).json({
            message:`user with is ${email} already exist `
        })
    }

    const hashedPassword = await  encriptedPassword(password);
    let token;

    // const payload = { name, email, phone, hashedPassword };
    // if (image) payload.image = image.path;

    if (image) {
        token = jwt.sign(
            {name,email,phone,image:image.path,hashedPassword}, 
            dev.app.jwtSecretKey,
            { expiresIn:'10m' },
            );
    } else {
        token = jwt.sign(
            {name,email,phone,hashedPassword}, 
            dev.app.jwtSecretKey,
            { expiresIn:'10m' },
            );
    }

        const emailData = {
            email,
            subject: 'Account activation Email',
            html: `
                  <h2>Hello ${name}!</h2>
                  <p>please click here to 
                      <a href="${dev.app.clientUrl}/api/v1/users/activate?token=${token}" 
                      terget="_blank">active your account</a></p>
                      `,
          }
          sendEmailWithNodeMailer(emailData)
       
    return res.status(200).json({
        message: "A verification link has been sent to your email.",
        token,
    })
   
} catch (error) {
    return res.status(500).json({
        message:error.message,
    })
}
}

const verifyEmail=(req,res)=>{

    try {
        
        const {token}=req.body;
        if(!token){
            return res.status(404).json({
                message: "token is missing ",
            })
        }

        const verifiedToken=jwt.verify(token,dev.app.jwtSecretKey,async (err,decoded)=>{
           ////handle error
            if(err){
                return res.status(401).json({
                    message: "token is expired ",
                })
            }
            ///distructure fields
            const {name,email,hashedPassword,phone ,image}=decoded;
            
            ///check user is exist on database
            const isExist = await UserModel.findOne({email})
            if(isExist){
                return res.status(400).json({
                    message:`user with is ${email} already exist `
                })
            }
            ///creating user without image
            ///save the user

            const newUser=new UserModel({
                name,
                email,
                password:hashedPassword,
                phone,
                is_verified:1,
                
            })

            if(image){
                newUser.image= image
            }
            const user=await newUser.save();
            if(!user){

                return res.status(400).json({
                    message: "user not created",
                })
            }

        return res.status(200).json({
            user,
            message: "user is created you can signin",
        })
        })



    } catch (error) {
        return res.status(500).json({
            message:error.message,
        })
    }
}

const loginUser = async (req, res) => {
    try {
        const {email,password}=req.body;
        if(!email || !password){
            return res.status(404).json({
                message: "email or password is missing",
                
            })
        }
        if(password.length <6){
            return res.status(404).json({
                message:"minimum length for password is 6"
            })
        }

        const user = await UserModel.findOne({email})
        if(!user){
            return res.status(404).json({
                message:`user with this ${email} not register `
            })
        }
        if(user.isBanned){
            return res.status(401).json({
                message:`user with this ${email} is banned `
            })
        }
    
        const isPasswordMatch=await comparePassword(password,user.password)
        if(!isPasswordMatch){
            return res.status(404).json({
                message:`email/password mismatched`
            })
        }

        //creating a session
        req.session.userId=user._id
      
        return res.status(200).json({
            user:{
                name:user.name,
                email:user.email,
                phone:user.phone,
                password:user.password,
                image:user.image,
            },
            message: "login successful",
            
        })
    } catch (error) {
        return res.status(500).json({
            message:error.message,
        })
    }
}

const logoutUser = (req, res) => {
    try {
        req.session.destroy();
        res.clearCookie('user_session')
        return res.status(200).json({
            ok:true,
            message: "logout successful",
            
        })
    } catch (error) {
        return res.status(500).json({
            ok:false,
            message:error.message,
        })
    }
}

const userProfile = async (req, res) => {
    try {
        const userData= await UserModel.findById(req.session.userId,{password:0,image:0});

        return res.status(200).json({
            ok:true,
            message: "profile is returned successfully",
            user:userData,
        })
    } catch (error) {
        return res.status(500).json({
            message:error.message,
        })
    }
}

const deleteUser = async (req, res) => {
    try {
        await UserModel.findByIdAndDelete(req.session.userId);

        return res.status(200).json({
            ok:true,
            message: "user was deleted successfully",
        })
    } catch (error) {
        return res.status(500).json({
            message:error.message,
        })
    }
}

const updateUser = async (req, res) => {
    try {
        const {name,password,phone} = req.body
        const image=req.file;

        const hashedPassword=await encriptedPassword(password)
        const upadtedData = await UserModel.findByIdAndUpdate(req.session.userId,{...req.body,password:hashedPassword},{new:true},);

        if(!upadtedData){
            return res.status(400).json({
                ok:false,
                message: "user was not updated",
            })
        }
        if(image){
            upadtedData.image= image.path
        }

        await upadtedData.save()

        return res.status(200).json({
            ok:true,
            message: "user was updated successfully",
            upadtedData,
        })
    } catch (error) {
        return res.status(500).json({
            message:error.message,
        })
    }
}

const forgetPassword=async (req,res) =>{
    try {
        const {email,password} = req.body;
        if(!email || !password){
            return res.status(404).json({
                message: "email or password is missing",
                
            })
        }
        if(password.length <6){
            return res.status(404).json({
                message:"minimum length for password is 6"
            })
        }
        const user = await UserModel.findOne({email})
        if(!user){
            return res.status(400).json({
                message:`user with this ${email} already exist `
            })
        }

    
        //hashing the new passowrd
 
        const hashedPassword = await  encriptedPassword(password);

    var token = jwt.sign(
        {email,hashedPassword}, 
        dev.app.jwtSecretKey,
        { expiresIn:'10m' },
        );

        const emailData = {
            email,
            subject: 'Account activation Email',
            html: `
                  <h2>Hello ${user.name}!</h2>
                  <p>please click here to 
                      <a href="${dev.app.clientUrl}/api/v1/users/reset-password?token=${token}" 
                      terget="_blank">reset your password</a></p>
                      `,
          }
          sendEmailWithNodeMailer(emailData)


        return res.status(200).json({
            ok:true,
            message: "An email has been sent for reseting password",
            token:token
        })
    } catch (error) {
        return res.status(500).json({
            message:error.message,
        })
    }
}

const resetPassword=(req,res)=>{

    try {
        const {token}=req.body;
        if(!token){
            return res.status(404).json({
                message: "token is missing ",
                
            })
        }

        const verifiedToken=jwt.verify(token,dev.app.jwtSecretKey,async (err,decoded)=>{
           ////handle error
            if(err){
                return res.status(401).json({
                    message: "token is expired ",
                })
            }
            ///distructure fields
            const {email,hashedPassword}=decoded;
            ///check user is exist on database
            const isExist = await UserModel.findOne({email})
            if(!isExist){
                return res.status(400).json({
                    message:`user with is ${email} already exist `
                })
            }
           
            //update user password
        
       const updateData= await UserModel.updateOne(
        {email:email},
        {$set:{password:hashedPassword},
        
        },
        {new:true}
        )
        if(!updateData){
            return res.status(400).json({
                message: "reset password was not successful",
            })
        }

        return res.status(200).json({
            updateData,
            message: "reset password was successful",
        })
        })



    } catch (error) {
        return res.status(500).json({
            message:error.message,
        })
    }
}



module.exports={registerUser,verifyEmail,loginUser,logoutUser,userProfile,deleteUser,forgetPassword,resetPassword,updateUser,}