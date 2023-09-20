import express from 'express';
import bodyParser from 'body-parser';
const validator = require('validator');
const crypto = require('crypto');
const moment = require('moment');
const path = require('path');
const bcrypt = require('bcryptjs');


const router = express.Router();

router.use(bodyParser.json());


// Hashes a given value using bcrypt
const hashValue = value => {
  let salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(value, salt);
};

// Generates a unique session identifier
const generateSessionIdentifier = () => crypto.randomBytes(30).toString('hex');

// Returns the path for a given template
const getTemplatePath = templateType => templateName => path.resolve(__dirname, `../views/${templateType}/${templateName}.ejs`);

// Validates an email address
const validateEmail = email => {
  const mailformat = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  if (!email) return 'Missing data :: email';
  if (!validator.isEmail(email) || !mailformat.test(email.replace(/\s/g, '').toLowerCase())) return `Please enter a valid email. The email you entered ${email} is not valid`;
  return null;
};

// Generates a reset token
const generateResetToken = () => crypto.randomBytes(20).toString('hex');

// Updates a user with a reset token and sets a session identifier
const updateUserWithResetToken = async (user, token) => {
  user.extensionattributes = user.extensionattributes || {};
  user.extensionattributes.login = user.extensionattributes.login || {};
  user.extensionattributes.login.password_reset_verification_link = token;
  user.extensionattributes.login.reset_password_expiration = moment().add(30, 'minutes').toDate();
  user.markModified('extensionattributes');
  await user.save();
  user.sessionIdentifier = generateSessionIdentifier();
};

// Sends a reset email to the user
const sendResetEmail = async (user, token) => {
  const templateName = 'reset_password';
  const emailData = {
    subject: 'Reset Password Request',
    templatePath: getTemplatePath('email')(templateName),
    customerData: {
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      verification_link: token
    },
  };
  await sendEmailToCustomer(emailData);
};

// Checks if a user has exceeded reset attempts
const hasExceededResetAttempts = user => {
  const MAX_ATTEMPTS = 5;
  const ONE_HOUR = 60 * 60 * 1000;
  if (!user.lastPasswordResetAttempt) return false;
  const timeSinceLastAttempt = Date.now() - new Date(user.lastPasswordResetAttempt).getTime();
  if (timeSinceLastAttempt > ONE_HOUR) user.passwordResetAttempts = 0;
  return user.passwordResetAttempts >= MAX_ATTEMPTS;
};

// Main function to handle password reset requests
const generateSendPasswordResetLink = async (req, res, next) => {
  const { email } = req.body;
  const customerEmail = email.replace(/\s/g, '').toLowerCase();
  const emailValidationError = validateEmail(customerEmail);
  if (emailValidationError) {
    logRequestToMongo(req.headers.host, 'forgotPassword', customerEmail, emailValidationError);
    return sendErrorResponse(res, emailValidationError);
  }
  const foundUser = await User.findOne({ 'email': customerEmail }).exec();
  if (!foundUser) {
    logRequestToMongo(req.headers.host, 'forgotPassword', customerEmail, 'Password reset link sent if user exists');
    return sendErrorResponse(res, 'Password reset link sent if user exists');
  }
  if (foundUser.isLocked) { // Check if account is locked
    return sendErrorResponse(res, 'Account is locked. Please contact support.');
  }
  if (hasExceededResetAttempts(foundUser)) {
    logRequestToMongo(req.headers.host, 'forgotPassword', customerEmail, 'Too many reset attempts');
    return sendErrorResponse(res, 'You have made too many password reset attempts. Please try again later.');
  }
  const resetToken = generateResetToken();
  await updateUserWithResetToken(foundUser, resetToken);
  await sendResetEmail(foundUser, resetToken);
  logRequestToMongo(req.headers.host, 'forgotPassword', customerEmail, 'success');
  res.status(200).send({
    status: 200,
    response: 'success',
    type: 'success',
    text: `Status: PENDING, reset link email was sent to customer :: ${customerEmail}`,
    timeout: 20000,
  });
  res.cookie('sessionIdentifier', user.sessionIdentifier, { httpOnly: true, secure: true });
};

// Sends an error response
const sendErrorResponse = (res, message) => res.status(400).send({
  status: 400,
  result: 'error',
  data: {
    type: 'error',
    timeout: 20000,
    error: message,
  },
});

// Logs requests to MongoDB
const logRequestToMongo = async (host, type, email, message) => {
  const log = new Log({
    host,
    type,
    email,
    message,
  });
  await log.save();
};

// Handles password reset
const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  const user = await User.findOne({
    passwordResetToken: token,
    passwordResetExpires: { $gt: Date.now() }
  });
  if (!user) return sendErrorResponse(res, 'Token is invalid or has expired.');
  const clientSessionIdentifier = req.cookies.sessionIdentifier;
  if (user.sessionIdentifier !== clientSessionIdentifier) return sendErrorResponse(res, 'Invalid session. Please try the reset process again.');
  const isSamePassword = await bcrypt.compare(newPassword, user.password);
  if (isSamePassword) return sendErrorResponse(res, 'The password cannot be a previously used password.');
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.sessionIdentifier = undefined;
  await user.save();
  return res.status(200).send({ message: 'Password has been reset.' });
};

// Placeholder function to send an email
const sendEmailToCustomer = async emailData => console.log(`Sending email to ${emailData.customerData.email} with subject ${emailData.subject}`);

// Middleware to clear expired tokens
const clearExpiredTokens = async (req, res, next) => {
  await User.updateMany(
    { passwordResetExpires: { $lt: Date.now() } },
    {
      $unset: {
        passwordResetToken: "",
        passwordResetExpires: "",
        sessionIdentifier: ""
      }
    }
  );
  next();
};

// Middleware to check if user is locked
router.use(checkIfUserIsLocked);
router.post('forgotPassword', forgotPassword);
router.post('resetPassword', clearExpiredTokens, resetPassword);
module.exports = router;
//# sourceMappingURL=password.js.map

// app.use(clearExpiredTokens);
// app.post('/request-password-reset', generateSendPasswordResetLink);
// app.post('/reset-password', resetPassword);
// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

// // router.post('/reset-password', async (req, res) => {
//   const { email } = req.body;
//   const user = await User.findOne({ email });
//   if (!user) {
//     return res.status(400).json({
//       status: 400,
//       result: 'error',
//       data: {
//         type: 'error',
//         timeout: 20000,
//         error: 'Invalid email address.',
//       },
//     });
//   }
//   const resetToken = generateResetToken();
//   await updateUserWithResetToken(user, resetToken);
//   await sendResetEmail(user, resetToken);
//   return res.status(200).json({
//     status: 200,
//     result: 'success',
//     data: {
//       type: 'success',
//       timeout: 20000,
//       text: `Status: PENDING, reset link email was sent to customer :: ${email}`,
//       timeout: 20000,

// },
//     });
//   });

//   router.post('/reset-password', async (req, res) => {
//     const { email } = req.body;
//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(400).json({
//         status: 400,
//         result: '
//           error',
//         data: {
//           type: 'error',
//           timeout: 20000,
//           error: 'Invalid email address.',
//         },

//       });

//     }
//     const resetToken = generateResetToken();
//     await updateUserWithResetToken(user, resetToken);
//     await sendResetEmail(user, resetToken);
//     return res.status(200).json({
//       status: 200,
//       result: 'success',
//       data: {
//         type: 'success',
//         timeout: 20000,
//         text: `Status: PENDING, reset link email was sent to customer :: ${email}`,
//         timeout: 20000,

//       },

//     });

//   });

//   router.post('/reset-password', async (req, res) => {
//     const {
//       email,
//       password,
//       confirmPassword,
//     } = req.body;
//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(400).json({
//         status: 400,
//         result: 'error',
//         data: {
//           type: 'error',
//           timeout: 20000,
//           error: 'Invalid email address.',

//         },

//       });

//     }
//     if (password !== confirmPassword) {
//       return res.status(400).json({
//         status:
//           400,
//         result: 'error',
//         data: {
//           type: 'error',
//           timeout: 20000,
//           error: 'Passwords do not match.',

//         },

//       });

//     }
//     const resetToken = generateResetToken();
//     await updateUserWithResetToken(user, resetToken);
//     await
//       sendResetEmail(user, resetToken);
//     return res.status(200).json({
//       status: 200,
//       result: 'success',
//       data: {
//         type: 'success',
//         timeout: 20000,
//         text: `Status: PENDING, reset link email was sent to customer
//         :: ${email}`,
//         timeout: 20000,

//       },

//     });

//   });

//   router.post('/reset-password', async (req, res) => {
//     const {
//       email,
//       password,
//       confirmPassword,
//     } = req.body;
//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(400).json({
//         status: 400,
//         result: 'error',
//         data: {
//           type: 'error
