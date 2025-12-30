import { Routes, Route } from 'react-router-dom';
import StartPage from './pages/StartPage';
import MenuPage from './pages/MenuPage';
import GamePage from './pages/GamePage';
import ScorePage from './pages/ScorePage';

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<StartPage />} />
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/video/:id" element={<GamePage />} />
        <Route path="/score" element={<ScorePage />} />
      </Routes>
    </div>
  );
}

export default App;
