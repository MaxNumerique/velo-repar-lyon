import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.GOOGLE_HOST,
  port: parseInt(process.env.GOOGLE_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.GOOGLE_EMAIL,
    pass: process.env.PASSWORD_APP,
  },
});

/**
 * Send a confirmation email
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} text - Plain text body
 * @param {string} html - HTML body
 */
export const sendEmail = async (to, subject, text, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"Velo Du Pelo" <${process.env.GOOGLE_EMAIL}>`,
      to,
      subject,
      text,
      html,
    });
    console.log("Message sent: %s", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

export default transporter;
