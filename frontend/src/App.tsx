import React from "react";
import { BrowserRouter as Router, Route, Routes, useParams } from "react-router-dom";
import { CompetitionPage } from "./pages/CompetitionPage";
import { HomePage } from "./pages/HomePage";

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/competition/:roomId" element={<CompetitionPage />} />
      </Routes>
    </Router>
  );
};

export default App;
