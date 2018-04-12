const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserShcema = new Schema({
  openid: {
    type: String,
    required: true
  },
  nickName: String,
  gender: Number,
  avatarUrl: String,
  city: String,
  province: String,
  country: String
})

module.exports = mongoose.model('User', UserShcema)