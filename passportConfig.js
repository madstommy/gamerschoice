const LocalStrategy = require("passport-local").Strategy;
const { pool } = require("./dbConfig");
const bcrypt = require("bcrypt");

function initialize(passport) {
   console.log("Initialized");

   const authenticateUser = (username, password, done) => {
      console.log(username, password);
      pool.query(`SELECT * FROM users WHERE username = $1`, [username], (err, results) => {
         if (err) {
            throw err;
         }
         console.log(results.rows);

         if (results.rows.length > 0) {
            const user = results.rows[0];

            bcrypt.compare(password, user.password, (err, isMatch) => {
               if (err) {
                  console.log(err);
               }
               if (isMatch) {
                  return done(null, user);
               } else {
                  return done(null, false, { message: "Password is incorrect" });
               }
            });
         } else {
            return done(null, false, {
               message: "Username not exsists",
            });
         }
      });
   };

   passport.use(new LocalStrategy({ usernameField: "username", passwordField: "password" }, authenticateUser));
   passport.serializeUser((user, done) => done(null, user.user_id));

   passport.deserializeUser((user_id, done) => {
      pool.query(`SELECT * FROM users WHERE user_id = $1`, [user_id], (err, results) => {
         if (err) {
            return done(err);
         }
         console.log(`ID is ${results.rows[0].user_id}`);

         return done(null, results.rows[0]);
      });
   });
}

module.exports = initialize;
