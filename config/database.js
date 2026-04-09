const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      "mongodb+srv://Eco:GST9WE4PodAk1kf7@ecosus.zbf9vge.mongodb.net/ecosus?retryWrites=true&w=majority&tls=true"
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        family: 4

      }
    );
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
