import React, { useState, useEffect, useRef } from "react";
import {
  AppBar,
  Backdrop,
  CircularProgress,
  Container,
  CssBaseline,
  Grid,
  IconButton,
  List,
  TextField,
  Toolbar,
  Typography,
} from "@mui/material";
import { Send } from "@mui/icons-material";
import axios from "axios";
import ChatItem from "./ChatItem";
// import Chat from "tqi"
// import Chat from "twilio-chat";
import { Client } from "@twilio/conversations";
import { useNavigate, useLocation } from "react-router-dom";

const ChatScreen = (props) => {
  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [Conversation, setConversation] = useState(null);
  const navigate = useNavigate();
  const scrollDiv = useRef(null);

  const { state } = useLocation();
  const { room, email } = state;
  console.log(room,email);

  const getToken = async (email) => {
    const response = await axios.get(`http://localhost:5000/token/${email}`);
    const { data } = response;
    return data.token;
  };

  useEffect(() => {
    let token = "";

    if (!email || !room) {
      //   props.history.replace("/");
      navigate("/");
      return;
    }

    const initializeChat = async () => {
      setLoading(true);
      try {
        token = await getToken(email);
      } catch {
        throw new Error("unable to get token, please reload this page");
      }

      const client = new Client(token);
// Use client


      client.on("tokenAboutToExpire", async () => {
        const token = await getToken(email);
        client.updateToken(token);
      });

      client.on("tokenExpired", async () => {
        const token = await getToken(email);
        client.updateToken(token);
      });

      client.on("ConversationJoined", async (Conversation) => {
        const messages = await Conversation.getMessages();
        setMessages(messages.items || []);
        scrollToBottom();
      });

      try {
        const Conversation = await client.getConversationByUniqueName(room);
        await joinConversation(Conversation);
        setConversation(Conversation);
        setLoading(false);
      } catch {
        try {
          const conversation = await client.createConversation({
            uniqueName: room,
            friendlyName: room,
          });
          await joinConversation(conversation);
          setConversation(conversation);
          setLoading(false);
        } catch (error) {
          console.error("Error creating conversation:", error);
          // You can handle specific errors here (e.g., if (error.code === '...'))
          throw new Error("Unable to create conversation, please reload this page");
        }
      }
    };

    initializeChat();
  }, [props]);

  const joinConversation = async (Conversation) => {
    if (Conversation.ConversationState.status !== "joined") {
      await Conversation.join();
    }
    Conversation.on("messageAdded", handleMessageAdded);
  };

  const handleMessageAdded = (message) => {
    setMessages((prevMessages) => [...prevMessages, message]);
    scrollToBottom();
  };

  const scrollToBottom = () => {
    const scrollHeight = scrollDiv.current.scrollHeight;
    const height = scrollDiv.current.clientHeight;
    const maxScrollTop = scrollHeight - height;
    scrollDiv.current.scrollTop = maxScrollTop > 0 ? maxScrollTop : 0;
  };

  const sendMessage = () => {
    if (text && String(text).trim()) {
      setLoading(true);
      console.log(text);
      Conversation && Conversation.sendMessage(text);
      setText("");
      setLoading(false);
    }
  };


  return (
    <Container component="main" maxWidth="md">
      <Backdrop open={loading} style={{ zIndex: 99999 }}>
        <CircularProgress style={{ color: "white" }} />
      </Backdrop>
      <AppBar elevation={10}>
        <Toolbar>
          <Typography variant="h6">
            {`Room: ${room}, User: ${email}`}
          </Typography>
        </Toolbar>
      </AppBar>
      <CssBaseline />
      <Grid container direction="column" style={styles.mainGrid}>
        <Grid item style={styles.gridItemChatList} ref={scrollDiv}>
          <List dense={true}>
            {messages &&
              messages.map((message) => (
                <ChatItem key={message.index} message={message} email={email} />
              ))}
          </List>
        </Grid>
        <Grid item style={styles.gridItemMessage}>
          <Grid container direction="row" justify="center" alignItems="center">
            <Grid item style={styles.textFieldContainer}>
              <TextField
                required
                style={styles.textField}
                placeholder="Enter message"
                variant="outlined"
                multiline
                rows={2}
                value={text}
                disabled={!Conversation}
                onChange={(event) => setText(event.target.value)}
              />
            </Grid>
            <Grid item>
              <IconButton
                style={styles.sendButton}
                onClick={sendMessage}
                disabled={!Conversation || !text}
              >
                <Send style={styles.sendIcon} />
              </IconButton>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Container>
  );
};

const styles = {
  textField: { width: "100%", borderWidth: 0, borderColor: "transparent" },
  textFieldContainer: { flex: 1, marginRight: 12 },
  gridItem: { paddingTop: 12, paddingBottom: 12 },
  gridItemChatList: { overflow: "auto", height: "70vh" },
  gridItemMessage: { marginTop: 12, marginBottom: 12 },
  sendButton: { backgroundColor: "#3f51b5" },
  sendIcon: { color: "white" },
  mainGrid: { paddingTop: 100, borderWidth: 1 },
};

export default ChatScreen;
