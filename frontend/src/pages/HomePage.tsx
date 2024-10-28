import { v4 as uuidv4 } from "uuid";
import { useNavigate } from "react-router-dom";

export const HomePage: React.FC = () => {
  const navigate = useNavigate();

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
