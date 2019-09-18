import { LobbyMember } from '../lobbyMember';
import { SocketServerMessage, LobbyMemberDetails, GameDetails, UserDetails } from '../../common/types';
import { MockClientConnection } from '../__mocks__/socketServer';


const user1 = {
  id: 'id1',
  username: 'username1',
} as UserDetails;

const user2 = {
  id: 'id2',
  username: 'username2',
}

const user3 = {
  id: 'id3',
  username: 'username3',
}


it('has a user', () => {
  const clientConnection = new MockClientConnection(user1);
  const member = new LobbyMember(clientConnection, new Map());
  expect(member.userDetails).toEqual(user1)
  clientConnection.complete();
})

describe('updating details', () => {
  it('can update lobbyMemberDetails', done => {
    const clientConnection = new MockClientConnection(user1);
    const member = new LobbyMember(clientConnection, new Map())
    const update = new Map([ user1, user2 ].map(user => ([
      user.id, {...user, currentGame: null}
    ])));

    const message = {
      member: {
        memberUpdate: [...update]
      }
    } as SocketServerMessage;
    member.updateLobbyMemberDetails(update);
    expect(clientConnection.sendMessage.mock.results[1]).toEqual(message)
  })

  // it('can update gameDetails', done => {
  //   const update =

  //   const message = {
  //     member: {
  //       memberUpdate: game1Details,
  //     }
  //   } as SocketServerMessage;

  //   clientConnection.serverMessage$.subscribe(msg => {
  //     expect(msg).toEqual(message);
  //     done();
  //   })

  //   member.updateGameDetails(game1Details);
  // });
})

// describe('joining game', done => {
//   const message = {

//   } as SocketServerMessage

//   clientConnection1.subscribe(msg => {
//     expect(msg).toEqual()
//   })
// });
