const express = require("express");
const { pool } = require("./dbConfig");
const bcrypt = require("bcrypt");
const passport = require("passport");
const flash = require("express-flash");
const session = require("express-session");
var cookieParser = require("cookie-parser");

// const bodyParser = require("body-parser");
require("dotenv").config();
const app = express();
app.listen(process.env.PORT || 3000);

const initializePassport = require("./passportConfig");
const { render } = require("ejs");

initializePassport(passport);
// app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.set("view engine", "ejs");
app.use(
   session({
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
   })
);

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

app.use(express.static(__dirname + "/public/images"));
app.use(express.static("public"));

app.get("/", function (req, res) {
   res.render("index");
});

app.get("/users/register", checkAuthenticated, (req, res) => {
   res.render("register.ejs");
});

app.post("/users/register", async (req, res) => {
   let username = req.body.username;
   let password = req.body.password;
   let password2 = req.body.password2;
   let errors = [];

   console.log({ username, password, password2 });

   if (!username || !password || !password2) {
      errors.push({ message: "Please enter all fields" });
   }

   if (password.length < 6) {
      errors.push({ message: "Password must be a least 6 characters long" });
   }

   if (password !== password2) {
      errors.push({ message: "Passwords do not match" });
   }

   if (errors.length > 0) {
      res.render("register", { errors, username, password, password2 });
   } else {
      hashedPassword = await bcrypt.hash(password, 10);
      console.log(hashedPassword);

      pool.query(`SELECT * FROM users WHERE username = $1`, [username], (err, results) => {
         if (err) {
            console.log(err);
         }
         console.log(results.rows);

         if (results.rows.length > 0) {
            return res.render("register", {
               message: "Name already registered",
            });
         } else {
            pool.query("CALL users_i($1, $2, $3)", [username, "email@email.com", hashedPassword], (err, results) => {
               if (err) {
                  throw err;
               }
               console.log(results.rows);
               req.flash("success_msg", "You are now registered. Please log in");
               res.redirect("/users/login");
            });
         }
      });
      req.session.uname = username;

      console.log("signup session name" + req.session.uname);
   }
});

app.get("/users/login", checkAuthenticated, (req, res) => {
   console.log(req.session.flash.error);
   res.render("login.ejs");
});

app.post(
   "/users/login",
   passport.authenticate("local", { successRedirect: "/users/dashboard", failureRedirect: "/users/login", failureFlash: true })
);

app.get("/users/dashboard", checkNotAuthenticated, (req, res) => {
   console.log(req.isAuthenticated());
   var suggestedGames = req.session.games;
   var name = req.user.username;
   var userName = req.session.uname;
   if (userName) {
      console.log("session name exsists: " + userName);
   } else {
      req.session.uname = name;
      let sessionName = req.session.uname;
      userName = sessionName;
      console.log("session name new: " + sessionName);
   }

   if (suggestedGames) {
      console.log("suggested games exsists: " + suggestedGames);
   } else {
      console.log("NO gamesssss");
   }

   res.render("dashboard", { user: userName, userRecommendations: suggestedGames });
});

app.post("/users/dashboard", (req, res) => {
   res.render("dashboard");
});

app.get("/users/survey", async function (req, res) {
   var gameIds = [];
   var userRandomGames = [];
   var user = req.session.uname;
   console.log("survey username: " + user);

   try {
      const res = await pool.query("SELECT * FROM games");
      const data = res.rows;
      data.forEach((row) => {
         gameIds.push(parseInt(row.game_id));
      });
      console.log(gameIds);
   } catch (err) {
      console.log(err.stack);
   }

   for (var i = gameIds.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = gameIds[i];
      gameIds[i] = gameIds[j];
      gameIds[j] = temp;
   }

   for (let i = 0; i < 10; i++) {
      try {
         const res = await pool.query("SELECT * FROM games WHERE game_id = $1", [gameIds[i]]);
         const data = res.rows;
         data.forEach((row) => {
            userRandomGames.push(row.title);
         });
      } catch (err) {
         console.log(err.stack);
      }
   }
   console.log(userRandomGames);

   res.render("survey", { userSuggestions: userRandomGames, username: user });
});

app.post("/users/survey", async function (req, res) {
   var answers = [];
   var filterGames = [];
   var filterAnswers = [];
   const q1a = req.body.q1answers;
   const q2a = req.body.q2answers;
   const q3a = req.body.q3answers;
   const q4a = req.body.q4answers;
   const q5a = req.body.q5answers;
   const q6a = req.body.q6answers;
   const q7a = req.body.q7answers;
   const q8a = req.body.q8answers;
   const q9a = req.body.q9answers;
   const q10a = req.body.q10answers;
   const gameTitles = req.body.userGameTitles;
   console.log(gameTitles);
   let errors = [];

   if (!q1a || !q2a || !q3a || !q4a || !q5a || !q6a || !q7a || !q8a || !q9a || !q10a) {
      errors.push({ message: "Please answer all questions" });
      res.render("survey", { errors, q1a, q2a, q3a, q4a, q5a, q6a, q7a, q8a, q9a, q10a });
   }

   if (errors.length > 0) {
      res.render("survey", { errors, q1a, q2a, q3a, q4a, q5a, q6a, q7a, q8a, q9a, q10a });
   } else {
      answers.push(q1a, q2a, q3a, q4a, q5a, q6a, q7a, q8a, q9a, q10a);

      var restt = gameTitles.split(",");
      for (let i = 0; i < restt.length; i++) {
         if (answers[i] === "A" || answers[i] === "B") {
            if (answers[i] === "A") {
               filterAnswers.push(true);
            } else if (answers[i] === "B") {
               filterAnswers.push(false);
            }
            filterGames.push(restt[i]);
         }
      }

      let u = req.session.uname;

      for (let i = 0; i < filterGames.length; i++) {
         try {
            await pool.query("CALL user_interests_i($1, $2, $3)", [u, filterGames[i], filterAnswers[i]]);
         } catch (err) {
            console.log(err.stack);
         }
      }

      try {
         await pool.query("CALL generate_recommendation($1)", [u], (err, result) => {
            if (err) {
               throw err;
            } else {
               console.log("has recommendations");
            }
         });
      } catch (err) {
         console.log(err.stack);
      }

      try {
         var userRecommendations = [];
         const ress = await pool.query(
            "SELECT games.title FROM games JOIN recommendations ON games.game_id = recommendations.gid WHERE recommendations.username = $1;",
            [req.session.uname]
         );
         const d = ress.rows;
         d.forEach((row) => {
            console.log(row.title);
            userRecommendations.push(row.title);
         });
      } catch (err) {
         console.log(err.stack);
      }

      res.render("aftersurvey", { userRecommendations: userRecommendations });
   }
});

app.get("/users/aftersurvey", async function (req, res) {
   console.log("AFTER survey get");

   res.render("aftersurvey");
});

app.post("/users/aftersurvey", async function (req, res) {
   var myGames = req.body.mygames;
   var u = req.user.username;

   console.log("AFTER survey POST");
   res.render("dashboard", { userRecommendations: myGames, uname: u });
});

function checkAuthenticated(req, res, next) {
   if (req.isAuthenticated()) {
      return res.redirect("/users/dashboard");
   }
   next();
}

function checkNotAuthenticated(req, res, next) {
   if (req.isAuthenticated()) {
      return next();
   }
   res.redirect("/users/login");
}
