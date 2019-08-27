import { BehaviorSubject, Observable } from 'rxjs';
import { LobbyMember } from './lobbyMember';
import { Lobby } from './lobby';
import uuidv4 from 'uuid/v4';
import { reduce } from 'rxjs/operators';
import { ClientChallenge } from '../../APIInterfaces/types';


export type ChallengeStatus =
  'accepted'
  | 'declined'
  | 'pending'
  | 'cancelled';

export interface ChallengeRequest {
  challenger: LobbyMember;
  challengerObservable: Observable<ChallengeStatus>;
  receiver: LobbyMember;
}
interface IChallenge extends ClientChallenge {
  subject: BehaviorSubject<ChallengeStatus>;
}

export class Challenge implements IChallenge {
  subject: BehaviorSubject<ChallengeStatus>;

  constructor(
    public clientChallenge: ClientChallenge
  ) {
    this.subject = new BehaviorSubject('pending');
  }

  get id() {
    return this.clientChallenge.id;
  }

  get challengerId() {
    return this.clientChallenge.challengerId;
  }

  get receiverId() {
    return this.clientChallenge.receiverId;
  }

}


export type LobbyChallengesObservable = Observable<Challenge>;
