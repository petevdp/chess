import { BehaviorSubject, Observable } from 'rxjs';
import { LobbyMember } from './lobbyMember';
import { Lobby } from './lobby';
import uuidv4 from 'uuid/v4';
import { reduce } from 'rxjs/operators';
import { ClientChallenge } from 'APIInterfaces/types';

// pass subject to each member
// produce challenge observable by listening to answers from members
// and if all broadcast their acceptance, complete the broadcast and output true
// if any decline, immediately complete and broadcast the result

export interface ChallengeRequest {
  challenger: LobbyMember;
  challengerObservable: Observable<ChallengeStatus>;
  receiver: LobbyMember;
}

export enum ChallengeStatus {
  accepted,
  declined,
  pending,
  cancelled,
}

export interface oldChallengeStatus {
  receiverStatus: ChallengeStatus;
  challengerStatus: ChallengeStatus;
}

export interface Challenge extends ClientChallenge {
  subject: BehaviorSubject<ChallengeStatus>;
}


export type LobbyChallengesObservable = Observable<Challenge>;
