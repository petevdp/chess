import { BehaviorSubject, Observable } from 'rxjs';
import { LobbyMember } from './lobbyMember';
import { Lobby } from './lobby';
import uuidv4 from 'uuid/v4';
import { reduce } from 'rxjs/operators';
import { ChallengeDetails } from '../../APIInterfaces/types';


export type ChallengeStatus =
  'accepted'
  | 'declined'
  | 'pending'
  | 'cancelled';



export type LobbyChallengesObservable = Observable<Challenge>;
