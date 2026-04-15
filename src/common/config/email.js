import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendMail = async (to, subject, html) => {
  await transporter.sendMail({
    from: process.env.SMTP_FROM_EMAIL,
    to,
    subject,
    html,
  });
};

const sendVerificationEmail = async (email, token) => {
  const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${token}`;
  await transporter.sendMail({
    from: process.env.SMTP_FROM_EMAIL,
    to: email,
    subject: "Verify your email address",
    html: `<p>Please verify your email by clicking the link below. It expires in 24 hours.</p>
           <a href="${verificationUrl}">${verificationUrl}</a>`,
  });
};

export { sendMail, sendVerificationEmail };
