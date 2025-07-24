const mongoose = require("mongoose");
const dotenv = require("dotenv")
dotenv.config()
const database_url = process.env.MONGO_URL

mongoose
  .connect(
    database_url
  )
  .then(() => console.log("Conexion a la base de datos exitosa"))
  .catch((error) =>
    console.log(
      "Ha ocurrido un error a la hora de conectar a la base de datos",
      error
    )
  );