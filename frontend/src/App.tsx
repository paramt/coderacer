import React from "react";
import { BrowserRouter as Router, Route, Routes, useNavigate, useParams } from "react-router-dom";
import CompetitionPage from "./pages/CompetitionPage";
import { v4 as uuidv4 } from "uuid";

// HomePage Component - for generating a new competition room
const HomePage: React.FC = () => {
  const navigate = useNavigate();

  // Function to create a new room and navigate to CompetitionPage
  const handleCreateRoom = () => {
    const roomId = uuidv4(); // Generate unique room ID
    navigate(`/competition/${roomId}`);
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen space-y-4">
      <h1 className="text-3xl font-bold">Welcome to Code Racer!</h1>
      <button onClick={handleCreateRoom} className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600">
        Create Race
      </button>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/competition/:roomId" element={<CompetitionRoute />} />
      </Routes>
    </Router>
  );
};

// Wrapper component to extract params and render CompetitionPage
const CompetitionRoute: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const username = prompt("Enter your username:") || "Anonymous"; // Prompt for username

  if (!roomId) {
    return <p>Error: Room ID is missing.</p>;
  }

  return <CompetitionPage roomId={roomId} username={username} />;
};

export default App;
