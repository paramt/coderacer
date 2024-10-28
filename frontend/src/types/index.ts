export interface ResultMessage {
  success: boolean;
  results: string[];
}

export interface PlayerInfo {
  name: string;
  code: string;
  results: ResultMessage | null;
}
