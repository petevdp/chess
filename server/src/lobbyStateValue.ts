

export interface LobbyStateValue {
  id: string;
  // called when deleted from lobby state
  cleanup: () => void;
  [key: string]: any;
}
