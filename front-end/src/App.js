import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';
import Home from './components/home';
import Story from './components/story';

function App() {
  localStorage.setItem("server", "http://localhost:3000");

  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/" element={<Home/>} />
          <Route path="/story/:id" element={<Story/>} />
          
        </Routes>
      </Router>
    </div>
  );
}

export default App;
