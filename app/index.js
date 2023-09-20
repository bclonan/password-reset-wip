import express from 'express';
import path from 'path';
import accountRoutes from './server/account/ResetPassword.js'; // Import the routes from ResetPassword.js

const app = express();

// Serve React frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../client/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/build', 'index.html'));
  });
} else {
  // If not in production, serve the forgot password screen
  app.get('/', (req, res) => {
    // ... (your existing code for the forgot password screen)
  });
}

// Use the routes from ResetPassword.js
app.use(accountRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
