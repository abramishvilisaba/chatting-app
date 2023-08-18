const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const mysql = require("mysql2");
require("dotenv").config({ path: "./.env" });

const app = express();
const server = http.createServer(app);

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    waitForConnections: true,
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT),
    queueLimit: 0,
});
console.log(process.env.ALLOWED_ORIGIN);

const corsOptions = {
    origin: process.env.ALLOWED_ORIGIN,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
};

app.use(cors(corsOptions));

const io = socketIo(server, {
    cors: corsOptions,
});

db.getConnection((err, connection) => {
    if (err) {
        console.error("MySQL connection error:", err);
        return;
    }
    console.log("Connected to MySQL database");
    connection.release();
});

// io.on("connection", (socket) => {
//     console.log("A user connected");

//     db.query("SELECT * FROM messages ORDER BY timestamp ASC", (err, results) => {
//         if (err) {
//             console.error("Error fetching messages:", err);
//             return;
//         }
//         socket.emit("initial messages", results);
//     });
// });

io.on("connection", (socket) => {
    console.log("A user connected");

    db.query("SELECT * FROM messages ORDER BY timestamp ASC", (err, results) => {
        if (err) {
            console.error("Error fetching messages:", err);
            return;
        }
        console.log(results);

        socket.emit("initial messages", results);
    });

    socket.on("chat message", (data) => {
        console.log("chat message", data);
        const { message, messageTags } = data;
        let tags = messageTags;
        const timestamp = new Date();
        const tagsArray = Array.isArray(tags) ? tags : [];
        const tagsString =
            tagsArray.length > 0 && JSON.stringify(tagsArray).length > 4
                ? JSON.stringify(tagsArray)
                : null;

        console.log("tagsArray", tagsArray);
        console.log(tagsArray.length);
        console.log(JSON.stringify(tagsArray).length);
        console.log(tagsString);

        const insertQuery = "INSERT INTO messages (message, tags, timestamp) VALUES (?, ?, ?)";
        db.query(insertQuery, [message, tagsString, timestamp], (err, results) => {
            if (err) {
                console.error("Error inserting message:", err);
                return;
            }
            const insertedMessage = {
                id: results.insertId,
                message,
                tags,
                timestamp,
            };
            io.emit("chat message", insertedMessage); // Emit the message to all connected clients
            socket.emit("chat message", insertedMessage); // Emit the message to the sender only
        });
    });

    socket.on("disconnect", () => {
        console.log("A user disconnected");
    });
});

server.listen(3001, () => {
    console.log("Server is listening on port 3001");
});
