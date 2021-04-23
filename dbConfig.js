require("dotenv").config();

const { Pool } = require("pg");

const isProduction = process.env.NODE_ENV === "production";

const connectionString = `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_DATABASE}`;

const pool = new Pool({
   connectionString: isProduction ? process.env.DATABASE_URL : connectionString,
   ssl: isProduction,
});

module.exports = { pool };

// <!-- <ul>
// <% for (var i=0; i <userAnswers.length; i++){ %>
// <li> <%= userAnswers[i] %> </li>
// <%   } %>
// </ul> -->

// <!-- <% websiteAnswers %> -->

// <!-- <ul>
//    <% var randoms = []; %> <% for (var i=0; i <websiteAnswers.length/2; i++) { %> <% var randNum = Math.floor(Math.random()
//    *websiteAnswers.length) %> <% if(randoms.includes(randNum)) {continue;} %> <% randoms.push(randNum); %>

//    <li><%= websiteAnswers[randNum] %></li>
//    <% } %>
// </ul> -->
