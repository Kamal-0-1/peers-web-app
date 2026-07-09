
import { useState } from "react"
import { Home } from "./pages/Home";
import { Call } from "./pages/Call";
import { Answer } from "./pages/Answer";

function App() {
  
  const[tab, setTab]=useState('home');

  return (
    <div>
      <header className="flex gap-10">
        <button onClick={()=>setTab('home')}>Home</button>
        <button onClick={()=>setTab('call')}>Call</button>
        <button onClick={()=>setTab('answer')}>Answer</button>
      </header>
      <main>
        { tab=='home' && <Home/>}
        { tab=='call' && <Call/>}
        { tab=='answer' && <Answer/>}
      </main>
    </div>
  )
}

export default App
