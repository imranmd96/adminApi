
const nodemailer = require("nodemailer");
const dev = require("../config/env.config");

exports.sendEmailWithNodeMailer = async (emailData) => {
    try {
      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: dev.app.smptUserName, // generated ethereal user
          pass: dev.app.smptPassword, // generated ethereal password
        },
      });
      const mailOptions = {               
        from: dev.app.smptUserName, // sender address
        to: emailData.email, // list of receivers
        subject: emailData.subject, // Subject line
        html: emailData.html, // html body
      };
  
      // send mail with defined transport object
      await transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log(error);
        } else {
          console.log("Message sent: %s", info.response);
        }
      });
    } catch (error) {
      console.log("Problem sending Email: ", error);
    }
  };