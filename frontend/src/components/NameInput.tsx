import React from "react";

interface NameInputProps {
  username: string;
  setUsername: React.Dispatch<React.SetStateAction<string>>;
  onSubmit: (event: React.FormEvent) => void;
}

export const NameInput: React.FC<NameInputProps> = ({ username, setUsername, onSubmit }) => {
  return (
    <div className="flex flex-col justify-center items-center">
      <h1 className="text-2xl font-bold mt-4">Code Racer</h1>

      <form onSubmit={onSubmit} className="flex items-center space-x-4 mt-4">
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="border p-2 rounded"
          placeholder="Enter your username"
        />
        <button type="submit" className="bg-blue-500 text-white py-2 px-4 rounded">
          Join
        </button>
      </form>
    </div>
  );
};
