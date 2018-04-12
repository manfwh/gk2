const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;
const RuneShcema = new Schema({
  helps: [
    {
      nickName: String,
      avatarUrl: String
    }
  ],
  owner: {
    type: ObjectId,
    ref: 'User'
  },

})

module.exports = mongoose.model('Rune', RuneShcema)