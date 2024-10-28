// websocket message types
export enum MessageType {
  JOIN_ROOM = "join_room",
  COUNTDOWN = "countdown",
  RACE_STARTED = "race_started",
  SYNC_CODE = "sync_code",
  CODE_UPDATE = "code_update",
  SUBMIT_CODE = "submit_code",
  SUBMISSION_RESULT = "submission_result",
  PLAYER_JOINED = "player_joined",
  RACE_FINISHED = "race_finished",
  GAME_OVER = "game_over",
  ERROR = "error",
}

export interface ResultMessage {
  success: boolean;
  results: string[]; // array of results from each test case
}

export interface PlayerInfo {
  name: string;
  code: string;
  results: ResultMessage | null;
}
