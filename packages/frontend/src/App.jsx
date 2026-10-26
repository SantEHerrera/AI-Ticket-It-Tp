import { Routes, Route } from 'react-router-dom'
import React, { useState, useEffect } from "react";
import Header from "./components/headers/Header.jsx"
import { createTheme, ThemeProvider } from '@mui/material'
import "./App.css";

function App() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("http://localhost:8000/hello")
      .then((response) => response.json())
      .then((data) => setMessage(data.message))
      .catch((error) => console.error("Error cargando mensaje.", error));
  }, []);

  const theme = createTheme({

  })


  return (
    <ThemeProvider>
      <Routes>

      </Routes>
    </ThemeProvider>
  );
}

export default App;
