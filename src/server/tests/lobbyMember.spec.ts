import { MockClientConnection } from './mocks/mocks';
import { LobbyMember } from '../lobbyMember';
import { SocketServerMessage, LobbyMemberDetails, GameDetails, UserDetails } from '../../common/types';

let clientConnection: MockClientConnection;
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

beforeEach(done => {
  clientConnection = new MockClientConnection(user1);
  member = new LobbyMember(clientConnection);
  done();
});

afterEach(done => {
  clientConnection.complete();
  clientConnection = null;
  member = null;
  done();
})

it('has a user', done => {
  expect(member.userDetails).toEqual(clientConnection.user);
  done();
})

describe('updating details', () => {
  it('can update lobbyMemberDetails', done => {
    const update = [
      {...user1, currentGame: 'game'}
    ] as LobbyMemberDetails[]

    const message = {
      lobby: {
        updateLobbyMemberDetails: update
      }
    } as SocketServerMessage;

    clientConnection.serverMessage$.subscribe(msg => {
      expect(msg).toEqual(message);
      done();
    });

    member.updateLobbyMemberDetails(update);
  })

  it('can update gameDetails', done => {
    const gameDetails = [
      {
        id: 'id',
        playerDetails: [
          { user: user1, colour: 'b' },
          { user: user2, colour: 'w'}
        ],
      }
    ] as GameDetails[];

    const message = {
      lobby: {
        lobby: {
          updateGameDetails: [
            gameDetails,
          ]
        }
      }
    } as SocketServerMessage;

    clientConnection.serverMessage$.subscribe(msg => {
      expect(msg).toEqual(message);
      done();
    })

    member.updateGameDetails(gameDetails);
  });
})
