const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const transactionSchema = new Schema({
  source_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Reference to the User model
    required: true,
  },
  source_name: String,
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Group", // Reference to the Group model
    required: true,
  },
  groupName: {
    type: String,
    default: "",
  },
  amount: {
    type: Number,
    required: true,
  },
  ref: {
    type: String,
    default: "",
  },
  type: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: "",
  },
  status: {
    type: String,
    default: "",
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

// model
const Transaction = mongoose.model("Transaction", transactionSchema);

module.exports = Transaction;
