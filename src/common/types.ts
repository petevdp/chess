import { Square } from './board';

export interface Details {
  id: string;
}
export interface ShortMove {
  from: Square;
  to: Square;
  playerId: string;
}

export type UserType = 'bot' | 'human';
export interface UserDetails extends Details {
  username: string;
  type: UserType;
}

export interface UserDetailsPartial {
  username?: string;
  id?: string;
}

export interface SessionDetails extends UserDetails {
  idToken: string;
}

export type Colour = 'b' | 'w';

export type drawReason =
  'in_stalemate'
  | 'in_threefold_repitition'
  | 'insufficient_material';

export const DRAW_REASONS: drawReason[] = [
  'in_stalemate',
  'in_threefold_repitition',
  'insufficient_material'
]

export type endReason =
  'checkmate'
  | 'stalemate'
  | 'resign'
  | 'disconnect'
  | drawReason;


export const END_REASONS: endReason[] = [
  ...DRAW_REASONS,
  'checkmate',
  'resign',
  'disconnect',
];


export interface EndState {
  winnerId: string | null;
  reason: GameEndReason;
}

export interface LobbyMemberDetails extends UserDetails {
  currentGame: string | null;
  leftLobby: boolean;
}

type ActionType = 'move' | 'resign' | 'disconnect' | 'offerDraw';

export interface GameUpdate {
  type: 'move' | 'end' | 'offerDraw';
  move?: ShortMove;
  end?: EndState;
}

export interface ClientPlayerAction {
  type: ActionType;
  move?: ShortMove;
  playerId: string;
}

export interface AuthPayload {
  user: UserDetails;
  idToken: string;
  expiresIn: string;
}

export interface PlayerDetails {
  user: UserDetails;
  colour: Colour;
}
export interface GameDetails {
  id: string;
  playerDetails: PlayerDetails[];
}

export interface CompleteGameInfo extends GameDetails {
  history: unknown;
  state: unknown;
}
export interface UserLogin {
  username: string;
  password: string;
  userType: UserType;
}
export interface ChallengeDetails {
  id: string;
  challengerId: string;
  receiverId: string;
}

export interface ClientLobbyState {
  members: Map<string, LobbyMemberDetails>;
}

export type SocketChannel = 'challenge' | 'lobby update';


export type ChallengeOutcome = 'accepted' | 'declined' | 'cancelled';

export interface ChallengeResolution {
  id: string;
  outcome: ChallengeOutcome;
}

export interface ChallengeResponse {
  challengeId: string;
  response: boolean;
}

export interface MemberMessage {
  memberUpdate: Array<[string, LobbyMemberDetails]>;
}

export interface GameMessage {
  update?: GameUpdate;
  loadGamePartial?: CompleteGameInfo | CompleteGameInfo[];
  joinGame?: CompleteGameInfo;
}

export interface SocketServerMessage {
  game?: GameMessage;
  member?: MemberMessage;
}

export interface SocketClientMessage {
  makeMove?: ClientPlayerAction;
}
