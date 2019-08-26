import * as http from 'http';
import * as SocketIO from 'socket.io';
import * as IOClient from 'socket.io-client';

import { MemberState, LobbyMember } from '../lobbyMember';
import { BehaviorSubject, Subject } from 'rxjs';
import { ClientChallenge, User, LobbyMemberDetails } from '../../../APIInterfaces/types';
import { ChallengeStatus, Challenge } from '../challenge';
import { filter } from 'rxjs/operators';


let httpServer: http.Server;
let serverAddr;
let ioServer: SocketIO.Server;

const user1 = {
  username: 'name',
  id: 'id1',
};

beforeAll((done) => {
  httpServer = http.createServer();
  ioServer = SocketIO(httpServer);
  httpServer.listen(3000, () => {
    serverAddr = httpServer.address();
    done();
  });
});

afterAll((done) => {
  httpServer.close();
  ioServer.close();
  done();
});

interface socketPair {
  server: SocketIO.Socket;
  client: SocketIOClient.Socket;
}

const getSocketPair = () => {
  return new Promise<socketPair>((resolve) => {
    const client = IOClient(`http://[${serverAddr.address}]:${serverAddr.port}`);
    ioServer.on('connection', (socket) => {
      resolve({client, server: socket});
    });
  });
};

test('getSocketPair works', async (done) => {
  const pair = await getSocketPair();
  const message = 'hello sockets';
  pair.server.on('msg', msg => {
    expect(msg).toEqual(message);
    done();
  });
  pair.client.emit('msg', message);
});


const createLobbyMember = async (user: User, challengeSubject) => {
  const pair = await getSocketPair();
  return {
    member: new LobbyMember(user, pair.server, challengeSubject),
    clientSocket: pair.client,
  };
};


describe('challenges', () => {

  let lobbyChallengeSubject: Subject<ClientChallenge>;

  const clientChallenge1 = {
    challengerId: 'id1',
    receiverId: 'id2',
    id: '1'
  } as ClientChallenge;

  beforeEach(done => {
    lobbyChallengeSubject = new Subject();
    done();
  });

  afterEach((done) => {
    lobbyChallengeSubject.subscribe({
      complete: () => done(),
    });
    lobbyChallengeSubject.complete();
  });


  test('can add a challenge to lobbyChallengeSubject', async (done) => {

    const {member, clientSocket} = await createLobbyMember(user1, lobbyChallengeSubject);

    lobbyChallengeSubject.subscribe({
      next: currClientChallenge => {
        expect(currClientChallenge).toEqual(clientChallenge1);
        done();
      }
    });

    clientSocket.emit('challengeRequest', clientChallenge1);
  });

  test('sends challenge to client, client responds', async (done) => {
    const { member, clientSocket } = await createLobbyMember(user1, lobbyChallengeSubject);
    const challenge = new Challenge(clientChallenge1);
    member.challenge(challenge);

    const response = 'accepted';

    challenge.subject
      .pipe(filter(status => status !== 'pending'))
      .subscribe(status => {
        expect(status).toEqual(response);
        done();
      });

    clientSocket.on(`challenge/${challenge.id}`, (clientChallenge: ClientChallenge) => {
      expect(clientChallenge).toEqual(challenge.clientChallenge);
      clientSocket.emit(`challengeResponse/${clientChallenge.id}`, true);
    });
  });
});

test('updatePlayerIndex sends new player index to client', async (done) => {
  const details = [{
    inGame: 'game1',
    ...user1,
  }] as LobbyMemberDetails[];

  const { member, clientSocket } = await createLobbyMember(user1, new Subject());
  clientSocket.on('lobbyMemberUpdate', receivedDetails => {
    expect(receivedDetails).toEqual(details);
    done();
  });

  member.updatePlayerIndex(details);
});
