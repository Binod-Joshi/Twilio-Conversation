import React, { useState } from "react";
import {
  Grid,
  TextField,
  Card,
  AppBar,
  Toolbar,
  Typography,
  Button,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Client } from "@twilio/conversations";

const WelcomeScreen = () => {
  const [email, setEmail] = useState("");
  const [room, setRoom] = useState("");
  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState("Register");
  const navigate = useNavigate();

  const login = () => {
    if (email && room) {
      navigate("/chat", { state: { room, email } });
    }
  };

  const Register = async () => {
    if (email) {
      const token = await getToken(email);
      if (token) {
        console.log(token);
        const client = new Client(token);
        console.log(client);
        if(client){
          setMessage("registered successfully.");
        }
      }
    }
  };

  const getToken = async (email) => {
    const response = await axios.post(`http://localhost:5000/token`, {
      identity: email,
    });
    return response.data.token;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    if (name === "email") {
      setEmail(value);
    } else if (name === "room") {
      setRoom(value);
    }
  };

  const handleSelect = (data) => {
    console.log(data);
    setSelected(data);
  };

  return (
    <>
      <AppBar style={styles.header} elevation={10}>
        <Toolbar>
          <Typography variant="h6">
            Chat App with Twilio Programmable Chat and React
          </Typography>
        </Toolbar>
      </AppBar>
      <Grid
        style={styles.grid}
        container
        direction="column"
        justifyContent="center"
        alignItems="center"
      >
        <div>
          <button onClick={(e) => handleSelect("Register")}>Register</button>
          <button onClick={(e) => handleSelect("Login")}>Login</button>
        </div>
        <Card style={styles.card} elevation={10}>
          <Grid item style={styles.gridItem}>
            <TextField
              name="email"
              required
              style={styles.textField}
              label="Email address"
              placeholder="Enter email address"
              variant="outlined"
              type="email"
              value={email}
              onChange={handleChange}
            />
          </Grid>
          {selected !== "Register" && (
            <Grid item style={styles.gridItem}>
              <TextField
                name="room"
                required
                style={styles.textField}
                label="Room"
                placeholder="Enter room name"
                variant="outlined"
                value={room}
                onChange={handleChange}
              />
            </Grid>
          )}
          {selected !== "Register" ? (
            <Grid item style={styles.gridItem}>
              <Button
                color="primary"
                variant="contained"
                style={styles.button}
                onClick={login}
              >
                Login
              </Button>
            </Grid>
          ) : (
            <Grid item style={styles.gridItem}>
              <Button
                color="primary"
                variant="contained"
                style={styles.button}
                onClick={Register}
              >
                Register
              </Button>
            </Grid>
          )}
          <h3>{message}</h3>
        </Card>
      </Grid>
    </>
  );
};

const styles = {
  header: {},
  grid: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  card: { padding: 40 },
  textField: { width: 300 },
  gridItem: { paddingTop: 12, paddingBottom: 12 },
  button: { width: 300 },
};

export default WelcomeScreen;