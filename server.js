const express = require("express");
const { pool } = require("./dbConfig");
const bcrypt = require("bcrypt");
const passport = require("passport");
const flash = require("express-flash");
const session = require("express-session");
require("dotenv").config();
const app = express();

const initializePassport = require("./passportConfig");

initializePassport(passport);

// const multer = require("multer");
// const upload = multer();
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
// app.use(upload.array());
app.use(express.static("public"));

app.get("/", function (req, res) {
   res.render("index");
});

app.get("/users/register", checkAuthenticated, (req, res) => {
   res.render("register.ejs");
});

app.get("/users/login", checkAuthenticated, (req, res) => {
   // flash sets a messages variable. passport sets the error message
   console.log(req.session.flash.error);
   res.render("login.ejs");
});

app.post("/users/login", passport.authenticate("local", { successRedirect: "/users/survey", failureRedirect: "/users/login", failureFlash: true }));

app.get("/users/dashboard", checkNotAuthenticated, (req, res) => {
   console.log(req.isAuthenticated());
   res.render("dashboard", { user: req.user.username });
});

app.get("/users/survey", function (req, res) {
   res.render("survey");
});

app.post("/users/survey", async function (req, res) {
   var answers = [];
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
   let errors = [];

   if (!q1a || !q2a || !q3a || !q4a || !q5a) {
      errors.push({ message: "Please answer all questions" });
      res.render("survey", { errors, q1a, q2a, q3a, q4a, q5a, q6a, q7a, q8a, q9a, q10a });
   }

   if (errors.length > 0) {
      res.render("survey", { errors, q1a, q2a, q3a, q4a, q5a, q6a, q7a, q8a, q9a, q10a });
   } else {
      console.log("success survey");
      console.log({ q1a, q2a, q3a, q4a, q5a });
      answers.push(q1a, q2a, q3a, q4a, q5a, q6a, q7a, q8a, q9a, q10a);
      console.log(answers);

      var games = [
         "They Are Billions",
         "Halo Wars: Definitive Edition",
         "Grand Theft Auto IV",
         "Yakuza 0",
         "Life Is Strange 2",
         "Star Wars: Battlefront 2",
         "The Jackbox Party Pack 2",
         "The Witcher 3",
         "Middle Earth Shadow of War",
         "Spore",
         "JUMP FORCE",
         "DRAGON BALL FighterZ",
         "Frostpunk",
         "ShellShock Live",
         "DiRT Rally 2.0",
      ];

      res.render("aftersurvey", { userAnswers: answers, websiteAnswers: games });
   }
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
   }
});

// app.post("/users/aftersurvey", function (req, res) {
//    var rand = Math.floor(random() * 100);

//    pool.query("SELECT games.title FROM games WHERE game_id = $1", [rand]);
//    res.render("aftersurvey");
// });

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

app.listen(3000, function () {
   console.log("server started on 3000");
});
