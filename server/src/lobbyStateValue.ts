

export interface LobbyStateValue<Details> {
  id: string;
  // called when deleted from lobby state
  cleanup: () => void;

  // for displaying to the client
  getDetails: () => Details;
}
