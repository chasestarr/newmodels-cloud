const bcrypt = require('bcrypt');

function create(password) {
  return bcrypt.hash(password, 10);
}

function compare(password, hash) {
  return bcrypt(password, hash);
}

module.exports = { create, compare };
