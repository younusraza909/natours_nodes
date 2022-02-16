const nodemailer = require('nodemailer');

const sendEmail = async options => {

  // 1)Create a transporter
  //will user mailtrap for testing purpose
  const transporter = nodemailer.createTransport({
    host: process.env.MAILTRAP_HOST,
    port: process.env.MAILTRAP_PORT,
    auth: {
      user: process.env.MAILTRAP_USERNAME,
      pass: process.env.MAILTRAP_PASSWORD
    }
  });
  //2) Define email options
  const mailOptions = {
    from: 'Younus Raza <younusraza909@gmail.com>',
    to: options.to,
    subject: options.subject,
    text: options.message
  };
  console.log(mailOptions);
  //3)Actually send th email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
//will use sendGrid service
//Example to send email from gmail transporter
//   const transporter = nodemailer.createTransport({
//     service: 'Gmail',
//     auth:{
//         user:"userEmail",
//         password:"userPassword"
//     }
//     //Activate in gmail "less secure app " option
//   });
