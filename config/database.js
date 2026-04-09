const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
        "mongodb://Eco:iW3o15X0ChPN4YZ0@ac-4mreb6j-shard-00-00.zbf9vge.mongodb.net:27017,ac-4mreb6j-shard-00-01.zbf9vge.mongodb.net:27017,ac-4mreb6j-shard-00-02.zbf9vge.mongodb.net:27017/ecosus?ssl=true&replicaSet=atlas-1x7uma-shard-0&authSource=admin&retryWrites=true&w=majority",
      
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
