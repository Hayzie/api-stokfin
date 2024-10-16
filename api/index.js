const express = require("express");
require("dotenv").config();
const bodyParser = require("body-parser");
const http = require("http");
// const fetch = require('node-fetch');
const crypto = require("crypto");
const app = express();
const cors = require("cors");
app.use(bodyParser.urlencoded({ extended: true }));
const PORT = process.env.PORT || 3000;
// const socketIo = require("socket.io");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const User = require("./model/User");
const Group = require("./model/Group");
const groupMember = require("./model/GroupMember");
const Invitation = require("./model/Invitation");
const Transaction = require("./model/Transaction");

const corsConfig = {
  optionsSuccessStatus: 200,
  origin: "https://stokfin.vercel.app",
  methods: "GET, HEAD, PUT, PATCH, POST, DELETE",
};
app.use(cors(corsConfig));
app.options("*", cors(corsConfig));

// app.use((req, res, next) => {
//   res.header("Access-Control-Allow-Origin", "https://stokfin.vercel.app");
//   res.header(
//     "Access-Control-Allow-Headers",
//     "Origin, X-Requested-With, Content-Type, Accept"
//   );
//   res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
//   res.header("Access-Control-Allow-Credentials", "true");
//   next();
// });

app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send("Hello, Express!");
});

function authenticateToken(req, res, next) {
  // Extract the JWT token from the Authorization header
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  console.log(token);

  // If no token is provided, return 401 Unauthorized
  if (!token) {
    return res
      .status(401)
      .json({ error: "Unauthorized - Access token missing" });
  }

  // Verify the JWT token
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      return res
        .status(403)
        .json({ error: "Forbidden - Access token invalid" });
    }
    req.user = user; // Attach the user object to the request for further processing
    next(); // Move to the next middleware or route handler
  });
}

// Refresh Token Endpoint
app.post("/refresh-token", (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  // Validate refresh token
  if (!isValidRefreshToken(refreshToken)) {
    return res.status(401).json({ message: "Invalid refresh token" });
  }

  // Generate new JWT token
  const newJwtToken = generateJwtToken();

  // Send new JWT token to the client
  res.json({ jwtToken: accessToken });
});

// Refresh Token Validation
function isValidRefreshToken(refreshToken) {
  // Check if refresh token is valid, exists in the database)
}

//signup route
app.post("/signup", async function (req, res) {
  console.log(req.body);

  try {
    const email = req.body.email;
    //Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "There's already an account with this email" });
    }
    // Create new user
    const newUser = await User.create({
      email: req.body.email,
      password: req.body.password,
      phone: 0,
      firstName: "",
      lastName: "",
      username: req.body.username,
      countryCode: "+27",
      refreshToken: "",
    });

    const token = jwt.sign(
      { email: newUser.email },
      process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn: "1h",
      }
    );
    const refreshToken = await generateRefreshToken({ email: newUser.email });
    newUser.refreshToken = refreshToken;
    await newUser.save();
    res.send(200, {
      user: newUser,
      accessToken: token,
      refreshToken: refreshToken,
    });
  } catch (error) {
    console.log(error);
  }
});

//sign-in route
app.post("/sign-in", async (req, res) => {
  try {
    const { email, password } = req.body;
    const reqBody = req.body;
    console.log(email, password);

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Email does not exist" });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ message: "Incorrect password. Please try again" });
    }
    const token = jwt.sign(
      { email: user.email },
      process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn: "1h",
      }
    );
    res.json({ accessToken: token, user: user, reqBody });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Example function to generate refresh token
const generateRefreshToken = async (payload) => {
  return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "7d",
  });
};

// Update a User
app.put("update-user/:id", async (req, res) => {
  const { id } = req.params;
  const { username, email } = req.body;

  try {
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { username, email },
      { new: true }
    );
    return res.json(updatedUser);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET user by ID
app.get("/profile/:userId", async (req, res) => {
  try {
    let userId = req.params.userId;
    //userId = "6644cf57b9964749e9e222ef";
    // Retrieve user from the database by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.json(user);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.put("/profile", async (req, res) => {
  console.log("user id", req.body.firstName);
  try {
    const { userId, username, email, firstName, lastName, phone, countryCode } =
      req.body;
    // Retrieve user from the database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    // Update user details
    user.username = username;
    user.email = email;
    user.phone = phone;
    user.lastName = lastName;
    user.firstName = firstName;
    user.countryCode = countryCode;
    // Save changes to the database
    await user.save();
    return res.json({ message: "Profile updated successfully", user });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// search all users
app.get("/search-users", async (req, res) => {
  const { term } = req.query;
  try {
    const users = await User.find({
      username: { $regex: term, $options: "i" },
    }); // Case-insensitive search
    return res.json(users);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// io.on("connection", (socket) => {
//   console.log("New client connected");
//   socket.on("disconnect", () => {
//     console.log("Client disconnected");
//   });
// });

// Endpoint to send an Invitation
app.post("/send-invitation", async (req, res) => {
  const { user_id, message, type, source_id, source_name, groupId } = req.body;

  // Validate required fields
  if (!user_id || !message || !type) {
    return res
      .status(400)
      .json({ error: "user_id, message, and type are required fields" });
  }

  // Validate notification type
  const validTypes = ["email", "sms", "in-app", "request", "invite"];
  if (!validTypes.includes(type)) {
    return res.status(400).json({ error: "Invalid notification type" });
  }

  try {
    // Create a new invitation
    const newInvitation = new Invitation({
      user_id,
      message,
      type,
      status: "unread",
      source_id,
      source_name,
      groupId,
    });

    // Saveto the database
    const savedInvitaion = await newInvitation.save();

    // Emit the new notification to the receiver
    //io.emit("new-notification", newInvitation);

    // Respond with the saved invitation
    return res.status(201).json(savedInvitaion);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Endpoint to get notifications by user ID
app.get("/invitations/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // Find invites where receiverId matches the userId
    const invitations = await Invitation.find({
      user_id: new mongoose.Types.ObjectId(userId),
    });

    if (invitations.length === 0) {
      return res
        .status(404)
        .json({ message: "No invitations found for this user." });
    }

    return res.json(invitations);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.get("/invitation/:id", async (req, res) => {
  try {
    const invitation = await Invitation.findById(req.params.id).exec();
    if (!invitation) {
      return res.status(404).json({ message: "Invitation not found" });
    }
    return res.json(invitation);
  } catch (error) {
    console.error("Error fetching invitation:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});
//Create a new group
app.post("/group-create", async function (req, res) {
  try {
    const newGroup = await Group.create({
      name: req.body.name,
      description: req.body.description,
      adminId: req.body.adminId,
      adminName: req.body.adminName,
      balance: 0,
    });

    //add to members table
    const newMember = await groupMember.create({
      groupId: newGroup._id,
      memberId: req.body.adminId,
    });
    return res.json(200, { success: "success", data: newGroup });
  } catch (error) {
    console.log(error);
    return res.json({ error: error.message });
  }
});

// Get groups members by group ID
app.get("/members/:groupId", async (req, res) => {
  const { groupId } = req.params;

  try {
    // const members = await groupMember.find({ groupId });
    const members = await groupMember.aggregate([
      { $match: { groupId: new mongoose.Types.ObjectId(groupId) } },
      {
        $lookup: {
          from: "users",
          localField: "memberId",
          foreignField: "_id",
          as: "memberDetails",
        },
      },
      { $unwind: "$memberDetails" },
      {
        $project: {
          _id: 0,
          memberDetails: 1,
        },
      },
    ]);
    return res.json(members.map((member) => member.memberDetails));
    // res.json(members);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post("/addMember", async (req, res) => {
  //add to members table
  try {
    const newMember = await groupMember.create({
      groupId: req.body.groupId,
      memberId: req.body.userId,
    });
    return res.json(newMember);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Get groups by user ID
app.get("/groups/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const groups = await Group.find({
      adminId: new mongoose.Types.ObjectId(userId),
    });

    if (groups.length === 0) {
      return res.status(404).json({ message: "No groups found." });
    }
    return res.json(groups);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

//get groups that a user is in, or belongs to
app.get("/joined-groups/:userId", async (req, res) => {
  const userId = req.params.userId;

  try {
    // Step 1: Find group memberships by user ID
    const groupMembers = await groupMember.find({ memberId: userId });

    // Step 2: Extract group IDs
    const groupIds = groupMembers.map((member) => member.groupId);

    // Step 3: Find groups by the extracted group IDs where the user is not the admin
    const groups = await Group.find({
      _id: { $in: groupIds },
      adminId: { $ne: userId }, // Exclude groups where the user is the admin
    });

    // Step 4: Return the list of groups
    return res.status(200).json(groups);
  } catch (error) {
    console.error("Error retrieving groups:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Update group
app.put("/update-group/:id", async (req, res) => {
  const { id } = req.params;
  const { name, description, icon } = req.body;

  try {
    const updatedGroup = await Group.findByIdAndUpdate(
      id,
      { name, description, icon },
      { new: true }
    );
    res.json(updatedGroup);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update group
app.put("/update-group-balance/:id", async (req, res) => {
  const { id } = req.params;
  const { balance } = req.body;

  if (typeof balance !== "number") {
    return res.status(400).json({ error: "Balance must be a number" });
  }

  try {
    const group = await Group.findById(id);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    group.balance += balance;
    const updatedGroup = await group.save();

    return res.json(updatedGroup);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.get("/group/:id", async (req, res) => {
  try {
    const group = await Group.findById(req.params.id).exec();
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }
    return res.json(group);
  } catch (error) {
    console.error("Error fetching invitation:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Endpoint to search for groups
app.get("/group-search/search", async (req, res) => {
  try {
    const query = req.query.query;
    const groups = await Group.find({
      name: { $regex: query, $options: "i" }, // Case-insensitive search
    });
    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: "Failed to search for groups" });
  }
});

// Delete Group
app.delete("delete-group/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const deletedGroup = await Group.findByIdAndDelete(id);
    res.json(deletedGroup);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// transactions

// POST route to create a new transaction
app.post("/transactions", async (req, res) => {
  const {
    source_id,
    source_name,
    groupId,
    groupName,
    type,
    description,
    status,
    amount,
  } = req.body;

  try {
    // Create a new transaction
    const newTransaction = new Transaction({
      source_id,
      source_name,
      groupId,
      groupName,
      amount,
      ref: "",
      type,
      description,
      status,
    });

    // Save the transaction to the database
    const savedTransaction = await newTransaction.save();

    // Send the saved transaction as a response
    return res.status(201).json(savedTransaction);
  } catch (err) {
    // Handle errors and send an appropriate response
    return res.status(500).json({ error: err.message });
  }
});

// Get transactions by user ID
app.get("/transactions/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const transactions = await Transaction.find({ source_id: userId }).sort({
      created_at: 1,
    });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/all-transactions/:userId", async (req, res) => {
  const userId = req.params.userId;

  try {
    // Step 1: Find all group IDs where the user is a member
    const groupMemberships = await groupMember
      .find({ memberId: userId })
      .select("groupId");
    const groupIds = groupMemberships.map((membership) => membership.groupId);

    // Step 2: Find all transactions for the retrieved group IDs
    const transactions = await Transaction.find({ groupId: { $in: groupIds } });

    return res.status(200).json(transactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});
//
app.listen(PORT, () => {
  try {
    mongoose.connect(process.env.MONGO_DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: process.env.DB_NAME,
      family: 4,
    });
    console.log(`Server is running on port ${PORT}`);
  } catch (e) {
    console.log(e.message);
  }
});

module.exports = app;
