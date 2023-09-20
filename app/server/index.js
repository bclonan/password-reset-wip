import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';

// Import other necessary modules and middleware
// ...

const app = express();

// Middleware to parse JSON requests
app.use(bodyParser.json());

// Middleware to handle CORS issues (if you're serving both frontend and backend from different origins)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Route to handle password reset
app.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;

  // TODO: Implement the logic to:
  // 1. Validate the token
  // 2. Update the user's password in the database
  // 3. Send a response to the client

  res.send('Password reset request received');
});

// Route to handle other authentication-related requests
// ...

// Serve React frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../client/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/build', 'index.html'));
  });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
