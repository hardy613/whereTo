import axios, { Axios } from "axios";
import csv from "csvtojson";
import haversine from "haversine";
import { resolve } from "node:path";
import { Airport, Flight } from "./flights.type";

let airports: Airport[];

/** @see airports */
const getDistanceBetweenAirports = async (code1: string, code2: string) => {
  if (airports === undefined) {
    airports = await csv({ noheader: true }).fromFile(
      resolve(__dirname, "./data/airports.csv")
    );
  }
  const [airport1, airport2] = [
    airports.find(({ field5 }) => field5 === code1),
    airports.find(({ field5 }) => field5 === code2),
  ];
  return haversine(
    { latitude: airport1.field7, longitude: airport1.field8 },
    { latitude: airport2.field7, longitude: airport2.field8 },
    { unit: "mile" }
  );
};

/** converts two dates to a delta of hours*/
const getFlightDuration = ({ time1, time2 }: { time1: Date; time2: Date }) => {
  return Math.round((time1.valueOf() - time2.valueOf()) / (1000 * 60 * 60));
};

const sortByScore = (a: Flight, b: Flight) => a.score - b.score;

export class FlightsService {
  private readonly httpClient: Axios;

  constructor() {
    this.httpClient = axios.create();
  }

  public async findByQuery({
    carrier,
    maxHours,
    acceptableDepartTimeMin,
    acceptableDepartTimeMax,
  }: {
    carrier: string;
    maxHours: number;
    acceptableDepartTimeMin: Date;
    acceptableDepartTimeMax: Date;
  }) {
    const { data: flights }: { data: Flight[] } = await this.httpClient.get(
      "https://gist.githubusercontent.com/bgdavidx/132a9e3b9c70897bc07cfa5ca25747be/raw/8dbbe1db38087fad4a8c8ade48e741d6fad8c872/gistfile1.txt"
    );
    const filteredFlightsSet = new Set<Flight>();

    for (const flight of flights) {
      flight.distance = await getDistanceBetweenAirports(
        flight.origin,
        flight.destination
      );

      flight.duration = getFlightDuration({
        time1: new Date(flight.arrivalTime),
        time2: new Date(flight.departureTime),
      });

      flight.score =
        flight.duration * (carrier === flight.carrier ? 0.9 : 1) +
        flight.distance;

      if (
        acceptableDepartTimeMin &&
        acceptableDepartTimeMin.valueOf() >=
          new Date(flight.departureTime).valueOf()
      ) {
        filteredFlightsSet.add(flight);
      }

      if (
        acceptableDepartTimeMax &&
        acceptableDepartTimeMax.valueOf() <=
          new Date(flight.departureTime).valueOf()
      ) {
        filteredFlightsSet.add(flight);
      }

      if (maxHours) {
        if (filteredFlightsSet.has(flight) && flight.duration >= maxHours) {
          filteredFlightsSet.delete(flight);
        } else if (flight.duration <= maxHours) {
          filteredFlightsSet.add(flight);
        }
      }
    }

    return filteredFlightsSet.size > 0
      ? Array.from(filteredFlightsSet).sort(sortByScore)
      : flights.sort(sortByScore);
  }
}
