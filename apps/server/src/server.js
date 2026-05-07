const dotenv = require('dotenv');
const app = require('./app');

dotenv.config();

const PORT = process.env.PORT || 3001;

/**
 * Start the HTTP server.
 */
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
