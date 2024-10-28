# Coderacer

## Approach

- React/Typescript in the frontend with Tailwind CSS
  - AceEditor for code editing
- FastAPI Python server for the backend
- WebSockets for real time communication between frontend and backend

## Features

- recieve feedback for each individual test case (private test values are hidden)
- basic error checking (e.g. rejects more than 2 players per room, can't have same name as opponent)
- responsive design

## Run locally

```
cd frontend
npm install
npm start
```

```
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 9000
```

- configure `TOTAL_TIME` in `./backend/config.py`

## Todo if I had more time

- cleanly handle player disconnects (inform other player)
- dark mode
