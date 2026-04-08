export type Venue = {
  name: string;
  capacity: number;
  dailyCost: number;
  parkingSpots: number;
};

export type Slot = {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
  duration: number;
  winterProb: number;
  summerProb: number;
};

export type Event = {
  size: number;
  winterRate: number;
  summerRate: number;
  minStaff: number;
  parkingRequired: number;
};

export type Schedule = {
  id?: string;
  date?: string;
  slotId: number;
  venueName: string;
  eventSize: number;
  byUser?: boolean;
  createdAt?: string;
  updatedAt?: string;
};
