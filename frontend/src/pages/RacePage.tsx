// RacePage.tsx
import React, { useEffect, useState, useRef } from "react";
import AceEditor from "react-ace";
import { useParams, useNavigate } from "react-router-dom";
import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/theme-github";

import { BASE_URL, editorOptions, WS_URL } from "../constants";
import { CopyLink } from "../components/CopyLink";
import { ResultsPane } from "../components/ResultsPane";
import { PlayerInfo, ResultMessage } from "../types";
import { NameInput } from "../components/NameInput";

export const RacePage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const [username, setUsername] = useState<string>("");
  const [isUsernameSet, setIsUsernameSet] = useState(false);

  const [countdown, setCountdown] = useState<number | null>(null);
  const [gameTimer, setGameTimer] = useState<number | null>(null);
  const [question, setQuestion] = useState<any | null>(null);
  const [isRaceStarted, setIsRaceStarted] = useState(false);
  const [raceFinishedMessage, setRaceFinishedMessage] = useState<string | null>(null);

  const [currentPlayer, setCurrentPlayer] = useState<PlayerInfo>({ name: username, code: "", results: null });
  const [opponent, setOpponent] = useState<PlayerInfo>({ name: "Opponent", code: "", results: null });

  const navigate = useNavigate();
  const socket = useRef<WebSocket | null>(null);

  const setupWebsocket = () => {
    const ws = new WebSocket(WS_URL);
    socket.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "join_room", room_id: roomId, username }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "countdown") {
        setCountdown(data.countdown);
      } else if (data.type === "race_started") {
        setQuestion(data.question);
        setCurrentPlayer((prev) => ({ ...prev, code: data.question.starting_code }));
        setOpponent((prev) => ({ ...prev, code: data.question.starting_code }));
        setIsRaceStarted(true);
        setCountdown(null);
        setGameTimer(data.time);
      } else if (data.type === "code_update" && data.username !== currentPlayer.name) {
        setOpponent((prev) => ({ ...prev, code: data.code }));
      } else if (data.type === "submission_result") {
        const result: ResultMessage = {
          success: data.success,
          results: data.results,
        };

        if (data.username === username) {
          setCurrentPlayer((prev) => ({ ...prev, results: result }));
        } else {
          setOpponent((prev) => ({ ...prev, results: result }));
        }
      } else if (data.type === "player_joined" && data.username !== currentPlayer.name) {
        const [firstPlayer, secondPlayer] = data.players;
        setCurrentPlayer((prev) => ({
          ...prev,
          name: firstPlayer === username ? firstPlayer : secondPlayer,
        }));
        setOpponent((prev) => ({
          ...prev,
          name: firstPlayer === username ? secondPlayer : firstPlayer,
        }));
      } else if (data.type === "race_finished") {
        setRaceFinishedMessage(`${data.winner} won!`);
        setGameTimer(null);
        setIsRaceStarted(false);
      } else if (data.type === "game_over") {
        setRaceFinishedMessage("Time's up! No one solved the problem.");
        setGameTimer(null);
        setIsRaceStarted(false);
      } else if (data.type === "error") {
        alert(data.message);
        navigate(0); // refresh
      }
    };

    return () => {
      ws.close();
    };
  };

  useEffect(() => {
    if (isRaceStarted && gameTimer !== null) {
      const timerInterval = setInterval(() => {
        setGameTimer((prev) => (prev !== null ? prev - 1 : null));
      }, 1000);

      return () => clearInterval(timerInterval);
    }
  }, [isRaceStarted, gameTimer]);

  const handleCodeChange = (newCode: string) => {
    setCurrentPlayer((prev) => ({ ...prev, code: newCode }));

    if (socket.current?.readyState === WebSocket.OPEN) {
      socket.current.send(JSON.stringify({ type: "sync_code", room_id: roomId, username, code: newCode }));
    }
  };

  const handleSubmit = () => {
    socket.current?.send(JSON.stringify({ type: "submit_code", room_id: roomId, username, code: currentPlayer.code }));
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
  };

  if (!roomId) {
    return <p>Error: Room ID is missing.</p>;
  }

  const handleUsernameSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (username.trim()) {
      setIsUsernameSet(true);
      setupWebsocket();
    }
  };

  if (!isUsernameSet) {
    return <NameInput username={username} setUsername={setUsername} onSubmit={handleUsernameSubmit} />;
  }

  return (
    <div className="w-full flex flex-col items-center p-4 space-y-4">
      <h1 className="text-2xl font-bold">Code Racer</h1>

      {countdown !== null && <p className="text-xl">Starting in: {countdown}</p>}

      {gameTimer !== null && <p className="text-xl">Time Remaining: {formatTime(gameTimer)}</p>}

      {raceFinishedMessage && <p className="text-xl font-bold">{raceFinishedMessage}</p>}

      {question && isRaceStarted && (
        <div className="w-full">
          <div className="p-4 border rounded">
            <h2 className="font-bold">{question.title}</h2>
            <p className="whitespace-pre-line">{question.description}</p>
          </div>
          <div className="flex flex-row w-full space-x-4">
            <div className="flex flex-col lg:flex-row  w-full space-x-4">
              <div className="lg:w-1/2">
                <h3 className="font-bold text-center">{currentPlayer.name}'s Editor</h3>
                <AceEditor value={currentPlayer.code} onChange={handleCodeChange} name="playerEditor" {...editorOptions} />
                <button onClick={handleSubmit} className="mt-4 bg-blue-500 text-white py-1 px-2 rounded">
                  Submit Code
                </button>
              </div>

              <div className="lg:w-1/2">
                <h3 className="font-bold text-center">{opponent.name || "Opponent"}'s Editor</h3>
                <AceEditor value={opponent.code} name="opponentEditor" readOnly {...editorOptions} />
              </div>
            </div>
          </div>

          <div className="w-full mt-4 p-4 border rounded flex">
            <ResultsPane name={currentPlayer.name} results={currentPlayer.results} />
            <ResultsPane name={opponent.name} results={opponent.results} />
          </div>
        </div>
      )}

      {!isRaceStarted && !countdown && !raceFinishedMessage && (
        <div className="p-4 border rounded flex flex-col items-center">
          <p className="pb-2">No one else is here yet! Invite your friends using this link:</p>
          <CopyLink url={`${BASE_URL}/race/${roomId}`} />
        </div>
      )}
    </div>
  );
};
