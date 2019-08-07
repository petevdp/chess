import { TestBed } from '@angular/core/testing';

import { RoomIndexService } from './room-index.service';

describe('RoomIndexService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: RoomIndexService = TestBed.get(RoomIndexService);
    expect(service).toBeTruthy();
  });
});
