import { ClientConnection } from '../socketServer';
import { LobbyMember } from '../lobbyMember';
import { SocketServerMessage, LobbyMemberDetails, GameDetails, UserDetails } from '../../common/types';

jest.mock('../socketServer.ts');

let clientConnection:
let member: LobbyMember;

const user1 = {
  id: 'id1',
  username: 'username1',
}

const user2 = {
  id: 'id2',
  username: 'username2',
}

const user3 = {
  id: 'id3',
  username: 'username3',
}

const game1Details = [
  {
    id: 'id',
    playerDetails: [
      { user: user1, colour: 'b' },
      { user: user2, colour: 'w' }
    ],
  }
] as GameDetails[];

beforeEach(done => {
  clientConnection = jest.mock('');
  member = new LobbyMember(clientConnection);
  done();
});

afterEach(done => {
  clientConnection.complete();
  done();
})

it('has a user', done => {
  expect(member.userDetails).toEqual(clientConnection.user);
  done();
})

describe('updating details', () => {
  it('can update lobbyMemberDetails', done => {
    const update = new Map([ user1, user2 ].map(user => ([
      user.id, {...user, currentGame: null}
    ])));

    const message = {
      member: {
        memberUpdate: update
      }
    } as SocketServerMessage;

    clientConnection.serverMessage$.subscribe(msg => {
      expect(msg).toEqual(message);
      done();
    });

    member.updateLobbyMemberDetails(update);
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

describe('joining game', done => {
  const message = {

  } as SocketServerMessage

  clientConnection.subscribe(msg => {
    expect(msg).toEqual()
  })
});
