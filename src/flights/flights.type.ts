export type Flight = {
  departureTime: string;
  arrivalTime: string;
  carrier: string;
  origin: string;
  destination: string;
  score?: number;
  distance?: number;
  duration?: number;
};

export type Airport = {
  field5: string; // iaca
  field7: string; // lat
  field8: string; // lon
};
