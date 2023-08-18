import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import Autosuggest from "react-autosuggest";
const _ = require("lodash");

const Main = () => {
    const [socket, setSocket] = useState(null);
    const [message, setMessage] = useState("");
    const [filterTags, setFilterTags] = useState([]);
    const [messageTags, setmessageTags] = useState([]);
    const [enabledTags, setEnabledTags] = useState([]);
    const [messages, setMessages] = useState([]);
    const [filteredMessages, setFilteredMessages] = useState([]);
    const [messagesSent, setMessagesSent] = useState(0);

    useEffect(() => {
        const socket = io(process.env.REACT_APP_API_URL, {
            extraHeaders: {
                "session-id": 1,
            },
        });
        return () => {
            socket.disconnect();
        };
    }, []);

    useEffect(() => {
        console.log(process.env.REACT_APP_API_URL);
        const socketInstance = io(process.env.REACT_APP_API_URL);
        setSocket(socketInstance);
        console.log("load");
        socketInstance.on("initial messages", (messagesData) => {
            console.log(messagesData);
            setMessages(messagesData);
        });
    }, [messagesSent]);

    useEffect(() => {
        const socketInstance = io(process.env.REACT_APP_API_URL);
        setSocket(socketInstance);
        return () => {
            if (socketInstance) {
                socketInstance.disconnect();
            }
        };
    }, []);

    useEffect(() => {
        console.log("set");
        const uniqueTagsArray = _.uniq(_.flatMap(messages, "tags"));
        const nonEmptyTags = uniqueTagsArray.filter((tag) => tag !== null && tag !== "");
        setEnabledTags(nonEmptyTags);
    }, [messagesSent, messages]);

    const handleSendMessage = () => {
        const socketInstance = io(process.env.REACT_APP_API_URL);
        setSocket(socketInstance);
        if (socket && message.trim() !== "") {
            console.log("handleSendMessage");
            socket.emit("chat message", { message, messageTags });
            setMessage("");
            setMessagesSent(messagesSent + 1);
            // setTags([]);
        }
    };

    const toggleTag = (tag) => {
        if (enabledTags.includes(tag)) {
            console.log("have tag");
        } else {
            setEnabledTags([...enabledTags, tag]);
        }
        if (filterTags.includes(tag)) {
            setFilterTags(filterTags.filter((t) => t !== tag && t !== ""));
        } else {
            setFilterTags([...filterTags, tag]);
        }
    };

    useEffect(() => {
        let filtered = messages.filter((msg) => {
            if (msg.tags === null || msg.tags.length === 0) {
                return true;
            }

            return msg.tags.some((tag) => filterTags.includes(tag)) || msg.tags.length === 0;
        });
        setFilteredMessages(filtered);
        console.log("filteredMessages = ", filteredMessages);
    }, [messages, filterTags]);

    const getSuggestions = (value) => {
        const inputValue = value.trim().toLowerCase();
        const inputLength = inputValue.length;

        return inputLength === 0
            ? []
            : enabledTags.filter((tag) => tag.toLowerCase().slice(0, inputLength) === inputValue);
    };

    const getSuggestionValue = (suggestion) => suggestion;

    const renderSuggestion = (suggestion) => <div>{suggestion}</div>;

    console.log("messageTags", messageTags);
    console.log("filterTags", filterTags);
    console.log("enabledTags", enabledTags);

    console.log("messages", messages);
    console.log("filteredMessages", filteredMessages);

    return (
        <div className="flex flex-row h-fit min-h-screen py-64 bg-gray-100 px-[25%] box-border gap-2 ">
            {/*  */}
            <div className="flex flex-col w-1/4 justify-between  bg-white rounded-lg shadow px-4 py-8    ">
                <h2 className="text-lg mb-4 h-1/6">Tags</h2>
                <div className="flex flex-col  h-4/6">
                    {filterTags.map((filterTags) => (
                        <button
                            key={filterTags}
                            onClick={() => toggleTag(filterTags)}
                            className={`bg-gray-200 text-gray-700 px-2 py-1 rounded mb-2 `}
                        >
                            {filterTags}
                        </button>
                    ))}
                </div>

                <div className="flex flex-row h-1/6 items-end">
                    <Autosuggest
                        suggestions={getSuggestions(filterTags.join(","))}
                        onSuggestionsFetchRequested={() => {}}
                        onSuggestionsClearRequested={() => {}}
                        getSuggestionValue={getSuggestionValue}
                        renderSuggestion={renderSuggestion}
                        inputProps={{
                            value: filterTags.join(","),
                            onChange: (event, { newValue }) => setFilterTags(newValue.split(",")),
                            className: "border rounded w-full p-2",
                            placeholder: "Enter tags (comma-separated)",
                        }}
                    />
                </div>
            </div>
            {/*  */}
            <div className="flex flex-col w-3/4  justify-between bg-white rounded-lg shadow p-8  ">
                <h1 className="text-2xl mb-4 h-1/6">Chat App</h1>
                <div className=" min-h-[66%]  pb-8">
                    <ul>
                        {filteredMessages
                            ? filteredMessages.map((msg) => (
                                  <li key={msg.id} className="mb-2">
                                      {msg.message}{" "}
                                      {msg.tags !== null && (
                                          <span className="text-gray-600">
                                              [Tags: {msg.tags.join(", ")}]
                                          </span>
                                      )}
                                  </li>
                              ))
                            : null}
                    </ul>
                </div>
                <div className="flex flex-row mt-8 h-1/6 justify-around items-end justify">
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="border rounded w-1/2 text-center p-2 mr-2"
                        placeholder="Enter your message"
                    />
                    <div className="flex flex-row h-1/6 items-end">
                        <input
                            type="text"
                            value={messageTags.join(",")}
                            onChange={(e) => setmessageTags(e.target.value.split(","))}
                            className="border rounded w-2/3 p-2 "
                            placeholder="Enter tags (comma-separated)"
                        />
                    </div>

                    <button
                        onClick={handleSendMessage}
                        className="bg-blue-500 text-white px-4 py-2 rounded ml-2"
                    >
                        Send
                    </button>
                </div>
            </div>
            {/*  */}
        </div>
    );
};
export default Main;
