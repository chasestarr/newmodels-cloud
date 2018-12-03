const prod = process.env.NODE_ENV === 'production';

const env = {
  'process.env.BACKEND_URL': prod ? 'https://api.newmodels.cloud' : 'http://localhost:8000',
};

module.exports = {
  presets: ['next/babel'],
  plugins: [['transform-define', env]],
};
