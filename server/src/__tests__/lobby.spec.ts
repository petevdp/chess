import * as http from 'http';
import * as IOClient from 'socket.io-client';
import { create } from 'domain';
import { Lobby } from '../lobby';
import { LobbyMember } from '../lobbyMember';
import { User } from '../../../APIInterfaces/types';

let httpServer: http.Server;
let serverAddr;

let lobby: Lobby;

const user1 = {
  username: 'name',
  id: 'id1',
};

beforeAll((done) => {
  httpServer = http.createServer();
  httpServer.listen(4500, () => {
    serverAddr = httpServer.address();
    done();
  });
});

afterAll((done) => {
  httpServer.close();
  done();
});

beforeEach(done => {
  lobby = new Lobby(httpServer);
  done();
});

afterEach(done => {
  lobby.close().then(done);
});

const createClient = () => {
  return IOClient(`http://[${serverAddr.address}]:${serverAddr.port}`);
};

test('can access state', (done) => {
  expect(lobby.state).toBeDefined();
  done();
});

it('adds member to state on connection', (done) => {
  const client = getClient();
  expect(lobby.state.members[user1.id]).toBeDefined();
});

// test('adds member to state on connection', (done) => {
//   const client = createClient();
// });
