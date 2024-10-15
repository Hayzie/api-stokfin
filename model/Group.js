const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const groupSchema = new Schema({
  name: String,
  icon: String,
  description: String,
  balance:Number,
  adminId: String,
  adminName:String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const Group = model('Group', groupSchema);
module.exports = Group;