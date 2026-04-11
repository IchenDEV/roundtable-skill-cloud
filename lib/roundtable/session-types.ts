/** 旧席列表项（与 DB 行对应，供客户端与服务端共用） */
export type SessionListItem = {
  id: string;
  topic: string;
  phase: string;
  currentRound: number;
  maxRounds: number;
  updatedAt: string;
  createdAt: string;
};
