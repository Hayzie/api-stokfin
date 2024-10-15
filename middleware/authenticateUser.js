// middleware/authenticateUser.js
const jwt = require('jsonwebtoken');

const authenticateUser = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, 'secret_key');
    req.userData = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

module.exports = authenticateUser;
