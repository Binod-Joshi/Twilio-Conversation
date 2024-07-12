import { useState, useEffect, useRef } from "react";
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
  Button,
} from "@mui/material";
import { Send } from "@mui/icons-material";
import axios from "axios";
import ChatItem from "./ChatItem";
import { Client } from "@twilio/conversations";
import { useNavigate, useLocation } from "react-router-dom";

const ChatScreen = () => {
  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [statusString, setStatusString] = useState("");
  const [status, setStatus] = useState("");
  const [participantEmail, setParticipantEmail] = useState(""); // New state for participant email
  const navigate = useNavigate();
  const scrollDiv = useRef(null);
  const listenersAdded = useRef(false);

  const location = useLocation();
  const { room, email } = location.state || {};

  useEffect(() => {
    if (!email || !room) {
      navigate("/");
      return;
    }

    const initializeChat = async () => {
      setLoading(true);
      try {
        const token = await getToken(email);
        const client = new Client(token);

        client.on("connectionStateChanged", (state) => {
          console.log("Connection state changed to:", state); // Added console log for debugging
          switch (state) {
            case "connecting":
              setStatusString("Connecting to Twilio...");
              setStatus("default");
              break;
            case "connected":
              setStatusString("You are connected.");
              setStatus("success");
              break;
            case "disconnecting":
              setStatusString("Disconnecting from Twilio...");
              setStatus("default");
              break;
            case "disconnected":
              setStatusString("Disconnected.");
              setStatus("warning");
              break;
            case "denied":
              setStatusString("Failed to connect.");
              setStatus("error");
              break;
            default:
              break;
          }
        });

        if (!listenersAdded.current) {
          client.on("conversationAdded", (conv) => {
            console.log("Conversation added:", conv.sid); // Added console log for debugging
            conv.getMessages().then((paginator) => {
              setMessages(paginator.items);
            });
            conv.on("messageAdded", (message) => {
              setMessages((prevMessages) => [...prevMessages, message]);
            });
            setConversation(conv);
          });

          client.on("conversationJoined", (conv) => {
            console.log("Joined conversation:", conv.sid); // Added console log for debugging
            setConversation(conv);
          });

          listenersAdded.current = true;
        }

        let generalConversation;
        try {
          const allConversations = await client.getSubscribedConversations();
          generalConversation = allConversations.items.find(
            (conv) => conv.uniqueName === room
          );

          if (!generalConversation) {
            console.log("Hello");
            const newConversation = await client.createConversation({
              uniqueName: room,
              friendlyName: room,
            });
            await newConversation.join();
            setConversation(newConversation);
          } else {
            await generalConversation.join();
            setConversation(generalConversation);
          }
        } catch (error) {
          console.error("Error fetching or creating conversation:", error); // Added detailed error logging
          if (error.message.includes("Conflict")) {
            const allConversations = await client.getSubscribedConversations();
            generalConversation = allConversations.items.find(
              (conv) => conv.uniqueName === room
            );
            if (generalConversation) {
              await generalConversation.join();
              setConversation(generalConversation);
            } else {
              console.error("Unable to fetch or create conversation:", error);
            }
          } else {
            console.error("Unable to fetch or create conversation:", error);
          }
        }

        setLoading(false);
      } catch (error) {
        console.error("Unable to initialize chat:", error);
        setLoading(false);
      }
    };

    initializeChat();
  }, [email, room, navigate]);

  const getToken = async (email) => {
    const response = await axios.post(`http://localhost:5000/token`, {
      identity: email,
    });
    return response.data.token;
  };

  const scrollToBottom = () => {
    if (scrollDiv.current) {
      const scrollHeight = scrollDiv.current.scrollHeight;
      const height = scrollDiv.current.clientHeight;
      const maxScrollTop = scrollHeight - height;
      scrollDiv.current.scrollTop = maxScrollTop > 0 ? maxScrollTop : 0;
    }
  };

  const sendMessage = async () => {
    if (text.trim() && conversation) {
      setLoading(true);
      try {
        await conversation.sendMessage(text);
        setText("");
        scrollToBottom();
      } catch (error) {
        console.error("Error sending message:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  const addParticipant = async () => {
    if (participantEmail.trim() && conversation) {
      try {
        const participants = await conversation.getParticipants();
        const participantExists = participants.some(participant => participant.identity === participantEmail.trim());
        
        if (participantExists) {
          console.log(`${participantEmail} is already in the conversation.`);
          return;
        }
  
        await conversation.add(participantEmail.trim());
        console.log(`${participantEmail} added to the conversation.`);
        setParticipantEmail("");
      } catch (error) {
        console.error(`Error adding participant ${participantEmail}:`, error);
        if (error.body && error.body.message) {
          alert(`Error: ${error.body.message}`);
        } else {
          alert('Error adding participant.');
        }
      }
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
            {messages.map((message, index) => (
              <ChatItem key={index} message={message} email={email} />
            ))}
          </List>
        </Grid>
        <Grid item style={styles.gridItemMessage}>
          <Grid
            container
            direction="row"
            justify="center"
            alignItems="center"
            spacing={1}
          >
            <Grid item style={styles.textFieldContainer}>
              <TextField
                required
                style={styles.textField}
                placeholder="Enter message"
                variant="outlined"
                multiline
                rows={2}
                value={text}
                onChange={(event) => setText(event.target.value)}
              />
            </Grid>
            <Grid item>
              <IconButton
                style={styles.sendButton}
                onClick={sendMessage}
                disabled={!conversation || !text.trim()}
              >
                <Send style={styles.sendIcon} />
              </IconButton>
            </Grid>
          </Grid>
        </Grid>
        <Grid item style={styles.gridItemAddParticipant}>
          <Grid
            container
            direction="row"
            justify="center"
            alignItems="center"
            spacing={1}
          >
            <Grid item style={styles.textFieldContainer}>
              <TextField
                style={styles.textField}
                placeholder="Enter participant email"
                variant="outlined"
                value={participantEmail}
                onChange={(event) => setParticipantEmail(event.target.value)}
              />
            </Grid>
            <Grid item>
              <Button
                variant="contained"
                style={styles.addButton}
                onClick={addParticipant}
                disabled={!conversation || !participantEmail.trim()}
              >
                Add Participant
              </Button>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
      <h1>{statusString}</h1>
    </Container>
  );
};

const styles = {
  textField: { width: "100%" },
  textFieldContainer: { flex: 1, marginRight: 12 },
  gridItem: { paddingTop: 12, paddingBottom: 12 },
  gridItemChatList: { overflow: "auto", height: "70vh" },
  gridItemMessage: { marginTop: 12, marginBottom: 12 },
  gridItemAddParticipant: { marginTop: 12, marginBottom: 12 }, // New style for adding participants
  sendButton: { backgroundColor: "#3f51b5" },
  sendIcon: { color: "white" },
  addButton: { backgroundColor: "#4caf50", color: "white" }, // New style for add participant button
  mainGrid: { paddingTop: 100 },
};

export default ChatScreen;