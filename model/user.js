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
  country: String,
  phone: String,
  formid: String,  // 用户发送模板消息
  isSend: {
    type: Boolean,
    default: false
  },
  createAt: {
    type: Date
  }
})
UserShcema.pre('save', function (next) {
  if (this.isNew) {
    this.createAt = Date.now();
  } 
  next()
});
module.exports = mongoose.model('User', UserShcema)