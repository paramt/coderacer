from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
import random
import asyncio

from run_tests import run_tests

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Sample questions loaded from JSON (replace with real file loading if necessary)
with open("questions.json") as f:
    QUESTIONS = json.load(f)

# Room data structure
rooms = {}

# Helper function to get a random question
def get_random_question():
    return random.choice(QUESTIONS)

class JoinRoomPayload(BaseModel):
    username: str
    room_id: str

# Define the WebSocket endpoint
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    room_id = None
    username = None

    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            message = json.loads(data)

            # Handle `join_room` message
            if message['type'] == 'join_room':
                username = message['username']
                room_id = message['room_id']

                # Create room if not exists and add WebSocket connection
                if room_id not in rooms:
                    rooms[room_id] = {
                        "players": {},
                        "question": get_random_question(),
                        "code_sync": {},
                        "status": "waiting"  # waiting, countdown, active, completed
                    }

                # Check if username is already taken in this room
                if username in rooms[room_id]["players"]:
                    await websocket.send_text(json.dumps({"type": "error", "message": "name already taken!"}))
                    continue

                # Add player to the room
                rooms[room_id]["players"][username] = websocket

                # Broadcast `player_joined` message to all players in the room
                for player, ws in rooms[room_id]["players"].items():
                    await ws.send_text(json.dumps({"type": "player_joined", "username": username}))

                # If two players have joined, start the countdown for both
                if len(rooms[room_id]["players"]) == 2:
                    await start_countdown(room_id)

            # Handle `sync_code` message
            elif message['type'] == 'sync_code':
                code = message['code']
                rooms[room_id]["code_sync"][username] = code

                # Broadcast code update to other player(s)
                for player, ws in rooms[room_id]["players"].items():
                    if player != username:
                        await ws.send_text(json.dumps({
                            "type": "code_update",
                            "username": username,
                            "code": code
                        }))

            # Handle `submit_code` message
            if message['type'] == 'submit_code':
                code = message['code']
                question = rooms[room_id]["question"]

                # Run the tests using the imported run_tests function
                full_code = code
                success, results = run_tests(full_code, question["public_tests"], question["private_tests"])

                # Notify both players about the result
                for player, ws in rooms[room_id]["players"].items():
                    await ws.send_text(json.dumps({
                        "type": "submission_result",
                        "username": username,
                        "success": success,
                        "results": results
                    }))

                # If successful submission, end the game
                if success:
                    rooms[room_id]["status"] = "completed"
                    for player, ws in rooms[room_id]["players"].items():
                        await ws.send_text(json.dumps({
                            "type": "race_finished",
                            "winner": username
                        }))

    except WebSocketDisconnect:
        # Remove user from room on disconnect
        if room_id and username:
            del rooms[room_id]["players"][username]
            if not rooms[room_id]["players"]:  # Delete room if empty
                del rooms[room_id]

async def start_countdown(room_id):
    rooms[room_id]["status"] = "countdown"
    countdown = 5

    print(rooms[room_id]["players"])

    # Send countdown messages to all players in the room
    while countdown > 0:
        for player, ws in rooms[room_id]["players"].items():
            await ws.send_text(json.dumps({"type": "countdown", "countdown": countdown}))
        countdown -= 1
        await asyncio.sleep(1)

    # Start the race
    rooms[room_id]["status"] = "active"
    for player, ws in rooms[room_id]["players"].items():
        await ws.send_text(json.dumps({
            "type": "race_started",
            "question": rooms[room_id]["question"],
        }))
