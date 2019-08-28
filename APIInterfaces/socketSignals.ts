export const lobbyServerSignals = {
  updateLobbyDetails: () => 'update lobby state',
  requestChallengeResponse: () => 'request challenge response',
  resolveChallenge: (id) => `resolve challenge ${id}`,
};

export const lobbyClientSignals = {
  postChallenge: () => 'post challenge',
  postChallengeResponse: (id: string) => `post challenge response ${id}`,
  postChallengeResolution: (id: string) => `post challenge resolution ${id}`,
};

export const gameServerSignals = {
  start: () => 'start game',
  newOpponentMove: () => 'new opponent move',
  end: () => 'end game'
};

export const gameClientSignals = {
  joinGame: () => 'join game',
  ready: () => 'game ready',
  newMove: () => 'game move',
  leave: () => 'leave game',
  surrender: () => 'surrender game',
};
