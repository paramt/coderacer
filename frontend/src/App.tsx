import React from "react";
import { BrowserRouter as Router, Route, Routes, useParams } from "react-router-dom";
import { RacePage } from "./pages/RacePage";
import { HomePage } from "./pages/HomePage";

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/race/:roomId" element={<RacePage />} />
      </Routes>
    </Router>
  );
};

export default App;
