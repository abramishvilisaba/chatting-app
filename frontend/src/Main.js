import React, { useRef, useState, useEffect } from "react";
import io from "socket.io-client";
import {
    Button,
    TextField,
    Autocomplete,
    Box,
    Typography,
    Paper,
    Grid,
    CircularProgress,
} from "@mui/material";
import { useTheme, ThemeProvider, createTheme } from "@mui/material/styles";
import _ from "lodash";
import SendIcon from "@mui/icons-material/Send";

const ColorModeContext = React.createContext({ toggleColorMode: () => {} });

const Main = () => {
    const [socket, setSocket] = useState(null);
    const [message, setMessage] = useState("");
    const [filterTags, setFilterTags] = useState([]);
    const [messageTags, setmessageTags] = useState([]);
    const [enabledTags, setEnabledTags] = useState([]);
    const [messages, setMessages] = useState([]);
    const [filteredMessages, setFilteredMessages] = useState([]);
    const [messagesSent, setMessagesSent] = useState(0);
    const [connected, setConnected] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    const maxRetries = 30;
    const retryInterval = 5000;

    const API_URL = process.env.REACT_APP_API_URL;

    useEffect(() => {
        console.log("trying to connect :", retryCount);
        async function pingServer() {
            try {
                const response = await fetch(`${API_URL}/ping`);
                if (response.ok) {
                    setConnected(true);
                }
            } catch (error) {
                console.error("Error while pinging the server:", error);
                if (retryCount < maxRetries) {
                    setTimeout(() => {
                        setRetryCount(retryCount + 1);
                        // pingServer();
                    }, retryInterval);
                }
            }
        }
        pingServer();
    }, [retryCount]);

    useEffect(() => {
        const socketInstance = io(API_URL);
        setSocket(socketInstance);

        socketInstance.on("initial messages", (messagesData) => {
            console.log(messagesData);
            setMessages(messagesData);
        });

        socketInstance.on("chat message", (messagesData) => {
            console.log(messagesData);
            setMessages([...messages, messagesData]);
        });

        return () => {
            socketInstance.disconnect();
        };
    }, [messagesSent]);

    const handleSendMessage = () => {
        const socketInstance = io(API_URL);
        setSocket(socketInstance);

        if (socket && message.trim() !== "") {
            console.log("handleSendMessage");
            socket.emit("chat message", { message, messageTags });
            setMessage("");
            setMessagesSent((prevMessagesSent) => prevMessagesSent + 1);
        }
    };

    const toggleTag = (tag) => {
        if (!enabledTags.includes(tag)) {
            setEnabledTags([...enabledTags, tag]);
        }

        if (filterTags.includes(tag)) {
            setFilterTags(filterTags.filter((t) => t !== tag && t !== ""));
        } else {
            setFilterTags([...filterTags, tag]);
        }
    };

    useEffect(() => {
        const uniqueTagsArray = _.uniq(_.flatMap(messages, "tags"));
        const nonEmptyTags = uniqueTagsArray.filter((tag) => tag !== null && tag !== "");
        setEnabledTags(nonEmptyTags);
    }, [messagesSent, messages]);

    useEffect(() => {
        try {
            console.log("messages", messages);
            const filtered = messages.filter((msg) => {
                if (msg.tags === null || msg.tags.length === 0) {
                    return true;
                }
                return msg.tags.some((tag) => filterTags.includes(tag)) || msg.tags.length === 0;
            });
            setFilteredMessages(filtered);
        } catch (error) {
            console.log("fitlter error", error);
        }
    }, [messages, filterTags]);

    const handleFormSubmit = (e) => {
        e.preventDefault();
        handleSendMessage();
    };

    const messageListRef = useRef(null);
    useEffect(() => {
        if (messageListRef.current) {
            messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
        }
    }, [filteredMessages]);

    return (
        <Box
            sx={{
                minHeight: "100vh",
                width: "100%",
                pt: "5%",
                mb: "10%",
            }}
        >
            {connected ? (
                <Grid container sx={{ height: "70vh", width: "60%", mx: "auto" }} spacing={2}>
                    <Grid item xs={4}>
                        <Paper
                            sx={{
                                height: "100%",
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "space-between",
                                p: 4,
                                flexGrow: 1,
                            }}
                        >
                            <Typography variant="h5" mb={2}>
                                Tags
                            </Typography>
                            <Box
                                sx={{
                                    height: "100%",
                                    display: "flex",
                                    flexDirection: "row",
                                    gap: 1.5,
                                    // flexGrow: 4,
                                    alignContent: "start",
                                    justifyContent: "start",
                                    alignItems: "start",
                                    flexWrap: "wrap",
                                }}
                            >
                                {filterTags.map((filterTag, i) => (
                                    <Button
                                        key={i}
                                        variant="outlined"
                                        onClick={() => toggleTag(filterTag)}
                                        sx={{
                                            width: "fit",
                                            minWidth: "20%",
                                            height: "40px",
                                            textAlign: "center",
                                        }}
                                    >
                                        {filterTag}
                                    </Button>
                                ))}
                            </Box>
                            <Autocomplete
                                multiple
                                id="tags"
                                options={enabledTags}
                                value={filterTags}
                                onChange={(e, newValue) => setFilterTags(newValue)}
                                freeSolo
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        variant="outlined"
                                        label="Enter tags"
                                        placeholder="Tags"
                                    />
                                )}
                            />
                        </Paper>
                    </Grid>
                    <Grid item xs={8}>
                        <Paper
                            sx={{
                                height: "100%",
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "space-between",
                                p: 4,
                                flexGrow: 3,
                            }}
                        >
                            <Typography variant="h4">Chat App</Typography>
                            <Box
                                ref={messageListRef}
                                sx={{
                                    flexGrow: 4,
                                    pb: 0,
                                    my: 1,
                                    overflow: "auto",
                                    height: "500px",
                                }}
                            >
                                <ul style={{ listStyle: "none", padding: 0 }}>
                                    {filteredMessages
                                        ? filteredMessages.map((msg) => (
                                              <li key={msg.id}>
                                                  <Typography variant="h6">
                                                      {msg.message}{" "}
                                                      {msg.tags.length > 0 && (
                                                          <span> ' {msg.tags.join(", ")} '</span>
                                                      )}
                                                  </Typography>
                                              </li>
                                          ))
                                        : null}
                                </ul>
                            </Box>
                            <Grid container spacing={2} alignItems="end">
                                <Grid item xs={7}>
                                    <form onSubmit={handleFormSubmit}>
                                        <TextField
                                            type="text"
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            variant="outlined"
                                            label="Enter your message"
                                            fullWidth
                                            size="normal"
                                            color="primary"
                                        />
                                    </form>
                                </Grid>
                                <Grid item xs={4}>
                                    <Autocomplete
                                        multiple
                                        id="message-tags"
                                        options={enabledTags}
                                        value={messageTags}
                                        onChange={(e, newValue) => setmessageTags(newValue)}
                                        freeSolo
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                variant="outlined"
                                                label="Enter tags"
                                                placeholder="Tags"
                                                fullWidth
                                                size="normal"
                                            />
                                        )}
                                    />
                                </Grid>
                                <Grid
                                    item
                                    xs={1}
                                    sx={{ height: "100%", alignItems: "center", display: "flex" }}
                                >
                                    <SendIcon
                                        fontSize="large"
                                        onClick={handleSendMessage}
                                        color="primary"
                                        sx={{ cursor: "pointer" }}
                                    />
                                </Grid>
                            </Grid>
                        </Paper>
                    </Grid>{" "}
                </Grid>
            ) : (
                <Box
                    fullWidth
                    sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        height: "40vh",
                    }}
                >
                    <CircularProgress sx={{ textAlign: "center" }} />
                </Box>
            )}
        </Box>
    );
};

export default Main;
