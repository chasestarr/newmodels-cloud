const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

function createHash(password) {
  return bcrypt.hash(password, 10);
}

function compareHash(password, hash) {
  return bcrypt.compareSync(password, hash);
}

function issueJwt(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET);
}

function userIdFromToken(token) {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  return decoded.userId;
}

module.exports = {
  createHash,
  compareHash,
  issueJwt,
  userIdFromToken,
};
