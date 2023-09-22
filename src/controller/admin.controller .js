const jwt = require('jsonwebtoken');
const fs=require('fs');
const UserModel = require("../model/users.model")
const inputValidateRules = require("../validator /input.validator")
const { encriptedPassword, comparePassword } = require("../validator /securePassword");
const dev = require('../config/env.config');
const { sendEmailWithNodeMailer } = require('../helper/email');
const ExcelJS = require('exceljs')

const adminRegistration=async (req,res)=>{
try {
   
    const {name,email,password,phone} = req.body
    const image=req.file
    inputValidateRules(name, email,password, phone,image,res)

    if(password.length <6){
        return res.status(404).json({
            message:"minimum length for password is 6"
        })
    }
    
    if(image && image.size >1000000){
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

    var token = jwt.sign(
        {name,email,phone,image,hashedPassword}, 
        dev.app.jwtSecretKey,
        { expiresIn:'10m' },
        );

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

const emailVerification=(req,res)=>{

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
                is_verified:1
            })
            if(image){
                newUser.image.data=fs.readFileSync(image.path)
                newUser.image.contentType=image.type

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

const loginAdmin = async (req, res) => {
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

        if(user.is_admin===0){
            return res.status(400).json({
                message:`not an admin`
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
                password:user.password
            },
            message: "login successful",
            
        })
    } catch (error) {
        return res.status(500).json({
            message:error.message,
        })
    }
}

const logoutAdmin = (req, res) => {
    try {
        req.session.destroy();
        res.clearCookie('admin_session')
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

const displayAllUsersLists = async (req, res) => {
    try {
   const users=await UserModel.find({is_admin:0})

        return res.status(200).json({
            ok:true,
            message: "return all users",
            users:users,
            
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

const updateAdmin = async (req, res) => {
    try {
        const{password}=req.body

        const hashedPassword=await encriptedPassword(password)
        const upadtedData = await UserModel.findByIdAndUpdate(req.session.userId,{...req.fields,password:hashedPassword},{new:true},);

        if(!upadtedData){
            return res.status(400).json({
                ok:false,
                message: "user was not updated",
            })
        }
        if(req.files.image){
            const {image}=req.files;
            upadtedData.image.data=fs.readFileSync(image.path)
            upadtedData.image.contentType=image.type
        }
        await upadtedData.save()

        return res.status(200).json({
            ok:true,
            message: "user was updated successfully",
        })
    } catch (error) {
        return res.status(500).json({
            message:error.message,
        })
    }
}

const forgetPassword=async (req,res) =>{
    try {
        const {email,password} = req.fields;
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
        const {token}=req.fields;
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

const createUserByAdmin=async (req,res)=>{
    try {
       
        const {name,email,password,phone} = req.body
        const image=req.file
        inputValidateRules(name, email,password, phone,image,res)
    
        if(password.length <6){
            return res.status(404).json({
                message:"minimum length for password is 6"
            })
        }
        
        if(image && image.size >1000000){
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
    
        var token = jwt.sign(
            {name,email,phone,image,hashedPassword}, 
            dev.app.jwtSecretKey,
            { expiresIn:'10m' },
            );
    
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

const updateUserByAdmin = async (req, res) => {
    try {
        const id=req.params.id;
        const {name,password,phone} = req.body
        const image=req.file;

        const hashedPassword=await encriptedPassword(password)
        const upadtedData = await UserModel.findByIdAndUpdate(id,{...req.body,password:hashedPassword},{new:true},);

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

const deleteUserByAdmin = async (req, res) => {
        try {
            const id=req.params.id;
            await UserModel.findByIdAndDelete(id);
    
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

const exportExcelData=async (req, res) => {
   try {

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Users');
    worksheet.columns = [
        { header: 'name', key: 'name', width: 10 },
        { header: 'email', key: 'email', width: 32 },
        { header: 'password', key: 'password', width: 32,},
        { header: 'phone', key: 'phone', width: 10 },
        { header: 'isBanned', key: 'isBanned', width: 32 },
        { header: 'is_admin', key: 'is_admin', width: 32,},
        { header: 'image', key: 'image', width: 32,},
      ];

      const userData = await UserModel.find({is_admin:0});
      userData.map((users) => {
        worksheet.addRow(users)
      })
      worksheet.getRow(1).eachCell((cell) => {
        cell.font={bold: true}
      })

      res.setHeader(
        'content-type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );

    res.setHeader(
        'content-Disposition',
        'attachment; filename='+ ' users.xlsx'
        );

        return workbook.xlsx.write(res).then(() => {
            res.status(200).end();
        })

   } catch (error) {
    return res.status(500).json({
        message:error.message,
    })
   }
}

///this router need to finish.its uncomplite.

const getAllUsers = async (req, res, next) => {
    try {
      const search = req.query.search ? req.query.search : '';
      const { page = 1, limit = 4 } = req.query;
  
      const searchRegExp = new RegExp('.*' + search + '.*', 'i');
      const filter = {
        isAdmin: { $ne: true },
        $or: [
          { name: { $regex: searchRegExp } },
          { email: { $regex: searchRegExp } },
          { phone: { $regex: searchRegExp } },
        ],
      };
  
      const options = { password: 0 };
      const users = await User.find(filter, options)
        .limit(limit)
        .skip((page - 1) * limit);
  
      const count = await User.find(filter).countDocuments();
  
      if (!users) throw createError(404, 'no users found');
  
      return successResponse(res, {
        statusCode: 200,
        message: 'returned all the users who are not admin',
        payload: {
          users: users,
          totalPages: Math.ceil(count / limit),
          currentPage: page,
          previousPage: page - 1,
          nextPage: page + 1,
        },
      });
    } catch (error) {
      next(error);
    }
  };

const adminController={
    adminRegistration,emailVerification,
    loginAdmin,logoutAdmin,userProfile,
    deleteUser,forgetPassword,resetPassword,
    updateAdmin,displayAllUsersLists,
    createUserByAdmin,updateUserByAdmin,
    deleteUserByAdmin,
    exportExcelData,
}
module.exports=adminController;
