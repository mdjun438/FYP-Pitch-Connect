const mongoose = require("mongoose");

mongoose
  .connect(process.env.CONNECTION_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  })
  .then(() => {
    console.log("DB connection done.");
  })
  .catch((err) => console.log("DB connection failed."));
