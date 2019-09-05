import { MockClientConnection } from './mocks/mocks';
import { LobbyMember } from '../lobbyMember';
import { SocketServerMessage, LobbyMemberDetails } from '../../common/types';

let clientConnection: MockClientConnection;

beforeEach(done => {
  clientConnection = new MockClientConnection({
    username: 'username',
    id: 'id',
  });
  done();
});

afterEach(done => {
  clientConnection.complete();
  clientConnection = null;
  done();
})

describe('challengeObservable', () => {
  let member: LobbyMember;
  beforeEach(done => {
    member = new LobbyMember(clientConnection);
    done();
  });

  afterEach(done => {
    member = null;
    done();
  })

  it('has a user', done => {
    expect(member.user).toEqual(clientConnection.user);
    done();
  })

  it('can update details', done => {
    const update = [
      {id: 'id1', username: 'user1' }
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
})
