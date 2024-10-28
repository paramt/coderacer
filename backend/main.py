from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import json
import random
import asyncio

from run_tests import run_tests
from config import TOTAL_TIME

app = FastAPI()

with open("questions.json") as f:
    QUESTIONS = json.load(f)

rooms = {}


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
                        "question": random.choice(QUESTIONS),
                        "code_sync": {},
                        "status": "waiting"
                    }

                # Check if username is already taken in this room
                if username in rooms[room_id]["players"]:
                    await websocket.send_text(json.dumps({"type": "error", "message": "name already taken"}))
                    continue

                if len(rooms[room_id]["players"]) >= 2:
                    await websocket.send_text(json.dumps({"type": "error", "message": "room is full"}))
                    continue

                # Add player to the room
                rooms[room_id]["players"][username] = websocket

                print("overwriting player " + username)

                player_names = list(rooms[room_id]["players"].keys())

                # Broadcast `player_joined` message to all players in the room
                for ws in rooms[room_id]["players"].values():
                    await ws.send_text(json.dumps({"type": "player_joined", "players": player_names}))

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
            elif message['type'] == 'submit_code':
                code = message['code']
                question = rooms[room_id]["question"]

                # Run the tests using the imported run_tests function
                success, results = run_tests(code, question["public_tests"], question["private_tests"])

                # Notify both players about the result
                for ws in rooms[room_id]["players"].values():
                    await ws.send_text(json.dumps({
                        "type": "submission_result",
                        "username": username,
                        "success": success,
                        "results": results
                    }))

                # If successful submission, end the game and announce the winner
                if success:
                    rooms[room_id]["status"] = "completed"
                    for ws in rooms[room_id]["players"].values():
                        await ws.send_text(json.dumps({
                            "type": "race_finished",
                            "winner": username,
                            "message": f"{username} solved the problem and won the game!"
                        }))

    except WebSocketDisconnect:
        # Remove user from room on disconnect
        if room_id and username:
            del rooms[room_id]["players"][username]
            if not rooms[room_id]["players"]:  # Delete room if empty
                del rooms[room_id]

async def start_timer(room_id):
    countdown = TOTAL_TIME
    while countdown > 0 and rooms[room_id]["status"] == "active":
        await asyncio.sleep(1)
        countdown -= 1

    # If timer runs out, end the game with no winner
    if countdown == 0 and rooms[room_id]["status"] == "active":
        rooms[room_id]["status"] = "completed"
        for ws in rooms[room_id]["players"].values():
            await ws.send_text(json.dumps({
                "type": "game_over",
                "message": "Time's up! No one solved the problem.",
            }))


async def start_countdown(room_id):
    rooms[room_id]["status"] = "countdown"
    countdown = 5

    # Send countdown messages to all players in the room
    while countdown > 0:
        for ws in rooms[room_id]["players"].values():
            await ws.send_text(json.dumps({"type": "countdown", "countdown": countdown}))
        countdown -= 1
        await asyncio.sleep(1)

    # Start the race and the 10-minute game timer
    rooms[room_id]["status"] = "active"
    for ws in rooms[room_id]["players"].values():
        await ws.send_text(json.dumps({
            "type": "race_started",
            "question": rooms[room_id]["question"],
            "time": TOTAL_TIME,
        }))
    asyncio.create_task(start_timer(room_id))  # Start the game timer
