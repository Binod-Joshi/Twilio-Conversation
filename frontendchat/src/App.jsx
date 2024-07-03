import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import WelcomeScreen from "./WelcomeScreen";
import ChatScreen from "./ChatScreen";

function App() {


  return (
    <Router>
      <Routes>
        <Route exact path="/chat" element={<ChatScreen/>} />
        <Route path="/" element={<WelcomeScreen/>} />
      </Routes>
    </Router>
  )
}

export default App
