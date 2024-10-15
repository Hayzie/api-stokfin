const mongoose = require('mongoose');
const Group = require('./Group');
const { Schema, model } = mongoose;

const groupMemberSchema = new Schema({
  groupId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'Group',
    required:true
  },
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const GroupMember = model('GroupMember', groupMemberSchema);
module.exports = GroupMember;