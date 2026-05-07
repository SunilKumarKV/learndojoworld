const dotenv = require('dotenv');

dotenv.config();

const app = require('./app');

const PORT = process.env.PORT || 3001;

/**
 * Start the HTTP server.
 */
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
