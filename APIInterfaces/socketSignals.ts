export const lobbyServerSignals = {
  updateLobbyDetails: () => 'update lobby state',
  requestChallengeResponse: () => 'request challenge response',
  resolveChallenge: (id) => `resolve challenge ${id}`,
  joinGame: () => 'join game',
};

export const lobbyClientSignals = {
  postChallenge: () => 'post challenge',
  postChallengeResponse: (id: string) => `post challenge response ${id}`,
  postChallengeResolution: (id: string) => `post challenge resolution ${id}`,
};

export const gameServerSignals = {
  gameUpdate: () => 'game update',
};

export const gameClientSignals = {
  ready: () => 'game ready',
  takeAction: () => 'take game action',
};
