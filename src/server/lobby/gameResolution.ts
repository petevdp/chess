import { LobbyMember } from "./lobbyMember"

export function fixedTime (time: number) {
  return () => time
}

// export function curve () {
//   return (members: [LobbyMember, LobbyMember]) => {
//   }
// }
