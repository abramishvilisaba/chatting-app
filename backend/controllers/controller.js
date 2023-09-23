const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const mysql = require("mysql2");
const session = require("express-session");
const { Message } = require("../models/index.js");

const app = express();
const server = http.createServer(app);

const corsOptions = {
    origin: process.env.ALLOWED_ORIGIN,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
};

app.use(cors(corsOptions));

const io = socketIo(server, {
    cors: corsOptions,
});

io.use((socket, next) => {
    sessionMiddleware(socket.request, socket.request.res, next);
});

const sessionMiddleware = session({
    secret: "my-key",
    resave: false,
    saveUninitialized: true,
});
app.use(sessionMiddleware);

io.on("connection", (socket) => {
    console.log("A user connected");

    Message.findAll({
        order: [["timestamp", "ASC"]],
    })
        .then((results) => {
            socket.emit("initial messages", results);
        })
        .catch((err) => {
            console.error("Error fetching messages:", err);
        });

    socket.on("chat message", (data) => {
        console.log("chat message", data);
        const { message, messageTags } = data;
        const tagsArray = Array.isArray(messageTags) ? messageTags : [];
        const timestamp = new Date();

        Message.create({
            message,
            tags: tagsArray,
            timestamp,
        })
            .then((insertedMessage) => {
                io.emit("chat message", insertedMessage);
                socket.emit("chat message", insertedMessage);
            })
            .catch((err) => {
                console.error("Error inserting message:", err);
            });
    });

    socket.on("disconnect", () => {
        console.log("A user disconnected");
    });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
