export interface ResultMessage {
  success: boolean;
  results: string[]; // array of results from each test case
}

export interface PlayerInfo {
  name: string;
  code: string;
  results: ResultMessage | null;
}
