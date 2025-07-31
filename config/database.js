const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGODB_URI ||
        "mongodb+srv://ecosus:Aa12345@@ecosus.zbf9vge.mongodb.net/ecosus",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );

  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
