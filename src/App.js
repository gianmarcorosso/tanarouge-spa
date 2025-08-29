import Header from './components/Header';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Music from './pages/Music';
import Live from './pages/Live';
import Info from './pages/Info';

function App() {
  return (
<Router>
  <Header />
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/music" element={<Music />} />
    <Route path="/live" element={<Live />} />
    <Route path="/info" element={<Info />} />
    <Route path="/home" element={<Navigate to="/" replace />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
</Router>
  );
}

export default App;