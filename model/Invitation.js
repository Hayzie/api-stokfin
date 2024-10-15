const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const invitationSchema = new Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Reference to the User model
    required: true,
  },
  source_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Reference to the User model
    required: true,
  },
  source_name: String,
  groupId: String,
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["email", "sms", "in-app", "request", "invite"],
    required: true,
  },
  status: {
    type: String,
    enum: ["sent", "read", "unread"],
    default: "unread",
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

// pre-save hook to update the updated_at field
invitationSchema.pre("save", function (next) {
  this.updated_at = Date.now();
  next();
});

// model
const Invitation = mongoose.model("Notification", invitationSchema);

module.exports = Invitation;
