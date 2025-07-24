const express = require('express');
const moment = require("moment-timezone")
const app = express();
const momentMiddleware = require("./middleware/moment.js")
require("./database.js")

//ENV
const dotenv = require("dotenv")
dotenv.config()

const port = process.env.PORT
const mongo_url = process.env.MONGO_URL

//Middlewares
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))
app.use(express.static("./src/public"))
app.use(momentMiddleware)

//Handlebars
const expressHandlebars = require("express-handlebars")
const hbs = expressHandlebars.create({
    runtimeOptions: {
        allowProtoPropertiesByDefault : true,
        allowProtoMethodsByDefault: true,
    },
    helpers: {
        formatDate: function (date) {
      const today = moment()
        .tz("America/Argentina/Buenos_Aires")
        .startOf("day");
      const tomorrow = moment()
        .tz("America/Argentina/Buenos_Aires")
        .startOf("day")
        .add(1, "day");
      const formattedDate = moment()
        .tz("America/Argentina/Buenos_Aires")
        .locale("es")
        .format("LLLL");

      if (
        moment(date).tz("America/Argentina/Buenos_Aires").isSame(today, "day")
      ) {
        return (
          "Hoy, " +
          moment(date)
            .tz("America/Argentina/Buenos_Aires")
            .locale("es")
            .format("dddd, D [de] MMMM [de] YYYY")
        );
      } else if (
        moment(date)
          .tz("America/Argentina/Buenos_Aires")
          .isSame(tomorrow, "day")
      ) {
        return (
          "Mañana, " +
          moment(date)
            .tz("America/Argentina/Buenos_Aires")
            .locale("es")
            .format("dddd, D [de] MMMM [de] YYYY")
        );
      } else {
        return moment(date)
          .tz("America/Argentina/Buenos_Aires")
          .locale("es")
          .format("dddd, D [de] MMMM [de] YYYY");
      }
    },
    json: function (context) {
        return JSON.stringify(context);
    },
    join: function (arr, separator) {
        return arr ? arr.join(separator) : "";
    },
    subtract: function (a, b) {
        return a - b;
    },
    lookup: function (obj, key) {
        return obj[key];
    },
    formatTurn: function (turn) {
      return turn === "morning" ? "Mañana" : turn === "afternoon" ? "Tarde" : turn;
    },
    let: function (value, options) {
        return options.fn(value);
    },
    contains: function (arr, value) {
        return arr && Array.isArray(arr) && arr.includes(value);
    }          
    }
})

app.engine("handlebars", hbs.engine)
app.set("view engine", "handlebars")
app.set("views", "./src/views")


// Sessions
const session = require("express-session")
const MongoStore = require("connect-mongo")
app.use(session({
    secret: "secretCow",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: mongo_url, ttl:14*24*60*60 }),
    cookie: {
        maxAge: 14*24*60*60
    }
}));

//Routes
const viewsRouter = require("./router/views.router.js")
const userRouter = require("./router/user.router.js")
const sessionRouter = require("./router/session.router.js")
const cowRouter = require("./router/cow.router.js")
const treatmentRouter = require("./router/treatment.router.js")
const dailyRouter = require("./router/daily.router.js")
app.use("/", viewsRouter)
app.use("/register", userRouter)
app.use("/login", sessionRouter)
app.use("/cow", cowRouter)
app.use("/treatment", treatmentRouter)
app.use("/daily", dailyRouter)

const httpServer = app.listen(port, () => {
    console.log(`Servidor testeando en el puerto ${port}`)
})