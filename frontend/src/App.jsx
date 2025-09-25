import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import LoginRegisterPage from "./LoginRegisterPage";


function App() {
  return (
    <LoginRegisterPage onLogin={(user) => console.log("Logged in:", user)} />
  );
}

export default App
