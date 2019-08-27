export const serverSignals = {
  updateLobbyDetails: () => 'update lobby state',
  requestChallengeResponse: () => 'request challenge response',
  resolveChallenge: (id) => `resolve challenge ${id}`,
  joinGame: id => `join game ${id}`,
};

export const clientSignals = {
  postChallenge: () => 'post challenge',
  postChallengeResponse: (id: string) => `post challenge response ${id}`,
  postChallengeResolution: (id: string) => `post challenge resolution ${id}`,
}
