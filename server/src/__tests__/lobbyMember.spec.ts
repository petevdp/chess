import * as http from 'http';
import * as SocketIO from 'socket.io';
import * as IOClient from 'socket.io-client';

import { LobbyMember } from '../lobbyMember';
import { Subject } from 'rxjs';
import {
  ChallengeDetails,
  User,
  LobbyMemberDetails
} from '../../../APIInterfaces/types';
import { Challenge } from '../challenge';
import { filter } from 'rxjs/operators';
import { lobbyServerSignals, lobbyClientSignals } from '../../../APIInterfaces/socketSignals';


let httpServer: http.Server;
let serverAddr;
let ioServer: SocketIO.Server;

const user1 = {
  username: 'name',
  id: 'id1',
};

interface socketPair {
  server: SocketIO.Socket;
  client: SocketIOClient.Socket;
}

const clientChallenge1 = {
  challengerId: 'id1',
  receiverId: 'id2',
  id: '1'
} as ChallengeDetails;

let lobbyChallengeSubject: Subject<ChallengeDetails>;
let lobbyMember: LobbyMember;
let clientSocket: SocketIOClient.Socket;

const getSocketPair = () => {
  return new Promise<socketPair>((resolve) => {
    const client = IOClient(`http://[${serverAddr.address}]:${serverAddr.port}`);
    ioServer.on('connection', (socket) => {
      resolve({client, server: socket});
    });
  });
};

const createLobbyMember = async (user: User, challengeSubject) => {
  const pair = await getSocketPair();
  return {
    member: new LobbyMember(user, pair.server, challengeSubject),
    clientSocket: pair.client,
  };
};

beforeAll((done) => {
  httpServer = http.createServer();
  ioServer = SocketIO(httpServer);
  httpServer.listen(5000, () => {
    serverAddr = httpServer.address();
    done();
  });
});

afterAll((done) => {
  debugger;
  httpServer.close();
  ioServer.close(done);
});

beforeEach(async (done) => {
  lobbyChallengeSubject = new Subject();
  const { member, clientSocket: socket } = await createLobbyMember(user1, lobbyChallengeSubject);
  lobbyMember = member;
  clientSocket = socket;
  done();
});

afterEach((done) => {
  lobbyChallengeSubject.subscribe({
    complete: () => done(),
  });
  lobbyChallengeSubject.complete();
});

describe('challenges', () => {

  test('can add a challenge to lobbyChallengeSubject', async (done) => {
    const {member, clientSocket} = await createLobbyMember(user1, lobbyChallengeSubject);

    lobbyChallengeSubject.subscribe({
      next: currClientChallenge => {
        expect(currClientChallenge).toEqual(clientChallenge1);
        done();
      }
    });

    clientSocket.emit(lobbyClientSignals.postChallenge(), clientChallenge1);
  });

  test('sends challenge to client, client responds', async (done) => {
    const challenge = new Challenge(clientChallenge1);
    lobbyMember.challenge(challenge);

    const response = 'accepted';

    challenge.subject
      .pipe(filter(status => status !== 'pending'))
      .subscribe(status => {
        expect(status).toEqual(response);
        done();
      });

    clientSocket.on(lobbyServerSignals.requestChallengeResponse(), (clientChallenge: ChallengeDetails) => {
      expect(clientChallenge).toEqual(challenge.clientChallenge);
      clientSocket.emit(lobbyClientSignals.postChallengeResponse(clientChallenge.id), true);
    });
  });
});

test('updatePlayerIndex sends new player index to client', (done) => {
  const details = [{
    currentGame: 'game1',
    ...user1,
  }] as LobbyMemberDetails[];

  clientSocket.on(lobbyServerSignals.updateLobbyDetails(), receivedDetails => {
    expect(receivedDetails).toEqual(details);
    done();
  });

  lobbyMember.updateLobbyDetails(details);
});
