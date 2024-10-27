import React, { useEffect, useState, useRef } from "react";
import { Controlled as CodeMirror } from "react-codemirror2";
import "codemirror/lib/codemirror.css";
import "codemirror/mode/python/python";
import "codemirror/addon/edit/closebrackets";
import "codemirror/addon/edit/matchbrackets";

import { BASE_URL, WS_URL } from "../constants";

interface CompetitionPageProps {
  roomId: string;
  username: string;
}

interface ResultMessage {
  success: boolean;
  results: string[];
}

interface PlayerInfo {
  name: string;
  code: string;
  results: ResultMessage | null;
}

const CompetitionPage: React.FC<CompetitionPageProps> = ({ roomId, username }) => {
  const [countdown, setCountdown] = useState<number | null>(null);
  const [question, setQuestion] = useState<any | null>(null);
  const [isRaceStarted, setIsRaceStarted] = useState(false);

  const [currentPlayer, setCurrentPlayer] = useState<PlayerInfo>({ name: username, code: "", results: null });
  const [opponent, setOpponent] = useState<PlayerInfo>({ name: "", code: "", results: null });

  const socket = useRef<WebSocket | null>(null);

  useEffect(() => {
    socket.current = new WebSocket(WS_URL);

    socket.current.onopen = () => {
      socket.current?.send(JSON.stringify({ type: "join_room", room_id: roomId, username }));
    };

    socket.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log(data);
      if (data.type === "countdown") {
        setCountdown(data.countdown);
      } else if (data.type === "race_started") {
        setQuestion(data.question);
        setCurrentPlayer((prev) => ({ ...prev, code: data.question.starting_code }));
        setOpponent((prev) => ({ ...prev, code: data.question.starting_code }));
        setIsRaceStarted(true);
        setCountdown(null);
      } else if (data.type === "code_update" && data.username !== currentPlayer.name) {
        setOpponent((prev) => ({ ...prev, code: data.code }));
      } else if (data.type === "submission_result") {
        const result: ResultMessage = {
          success: data.success,
          results: data.results,
        };

        // Update the results for the appropriate player based on username
        if (data.username === username) {
          setCurrentPlayer((prev) => ({ ...prev, results: result }));
        } else {
          setOpponent((prev) => ({ ...prev, results: result }));
        }
      } else if (data.type === "player_joined" && data.username !== currentPlayer.name) {
        setOpponent((prev) => ({ ...prev, name: data.username }));
      }
    };

    return () => {
      socket.current?.close();
    };
  }, []);

  const handleCodeChange = (newCode: string) => {
    setCurrentPlayer((prev) => ({ ...prev, code: newCode }));
    socket.current?.send(JSON.stringify({ type: "sync_code", room_id: roomId, username, code: newCode }));
  };

  const handleSubmit = () => {
    socket.current?.send(JSON.stringify({ type: "submit_code", room_id: roomId, username, code: currentPlayer.code }));
  };

  return (
    <div className="flex flex-col items-center p-4 space-y-4">
      <h1 className="text-2xl font-bold">Code Racer</h1>

      {countdown !== null && <p className="text-xl">Starting in: {countdown}</p>}

      {question && isRaceStarted && (
        <div>
          <div className="p-4 border rounded">
            <h2 className="font-bold">{question.title}</h2>
            <p>{question.description}</p>
          </div>
          <div className="flex flex-row w-full space-x-4">
            <div className="flex w-full space-x-4">
              <div className="w-1/2">
                <h3 className="font-bold text-center">{currentPlayer.name}'s Editor</h3>
                <CodeMirror
                  value={currentPlayer.code}
                  options={{
                    mode: "python",
                    lineNumbers: true,
                    theme: "default",
                    indentUnit: 4,
                    smartIndent: true,
                    tabSize: 4,
                    indentWithTabs: true,
                    autoCloseBrackets: "()[]{}''\"\"",
                    matchBrackets: true,
                    electricChars: true,
                  }}
                  onBeforeChange={(editor, data, value) => handleCodeChange(value)}
                />
                <button onClick={handleSubmit} className="mt-4 bg-blue-500 text-white py-1 px-2 rounded">
                  Submit Code
                </button>
              </div>

              <div className="w-1/2">
                <h3 className="font-bold text-center">{opponent.name || "Opponent"}'s Editor</h3>
                <CodeMirror
                  value={opponent.code}
                  options={{
                    mode: "python",
                    lineNumbers: true,
                    theme: "default",
                    readOnly: true,
                  }}
                  onBeforeChange={() => {}}
                />
              </div>
            </div>
          </div>

          <div className="w-full mt-4 p-4 border rounded flex">
            <div className="w-full">
              <h4 className="font-bold">{currentPlayer.name}'s Results</h4>
              {currentPlayer.results ? (
                currentPlayer.results.results?.map((result, index) => (
                  <p key={index} className={`${result.includes("passed") ? "text-green-700" : "text-red-700"}`}>
                    {result}
                  </p>
                ))
              ) : (
                <p>No results yet. Submit your code to see results.</p>
              )}
            </div>

            <div className="w-full">
              <h4 className="font-bold">{opponent.name || "Opponent"}'s Results</h4>
              {opponent.results ? (
                opponent.results.results.map((result, index) => (
                  <p key={index} className={`${result.includes("passed") ? "text-green-700" : "text-red-700"}`}>
                    {result}
                  </p>
                ))
              ) : (
                <p>No results from opponent yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {!isRaceStarted && !countdown && (
        <div className="p-4 border rounded">
          <p>
            No one else is here yet! Invite your friends with the link {BASE_URL}/competition/
            {roomId}
          </p>
        </div>
      )}
    </div>
  );
};

export default CompetitionPage;
