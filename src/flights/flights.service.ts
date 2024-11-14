import axios, { Axios } from "axios";
import csv from "csvtojson";
import haversine from "haversine";
import { resolve } from "node:path";
import { Airport, Flight } from "./flights.type";

let airports: Airport[];
async function getDistanceBetweenAirports(
  code1: string,
  code2: string
): Promise<number> {
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
}

/** converts two dates to a delta of hours*/
function getFlightDuration({
  arrivalTime,
  departureTime,
}: {
  arrivalTime: Date;
  departureTime: Date;
}) {
  return Math.round(
    (arrivalTime.valueOf() - departureTime.valueOf()) / (1000 * 60 * 60)
  );
}

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
    const filteredFlights: Flight[] = [];

    for (const flight of flights) {
      flight.distance = await getDistanceBetweenAirports(
        flight.origin,
        flight.destination
      );

      flight.duration = getFlightDuration({
        arrivalTime: new Date(flight.arrivalTime),
        departureTime: new Date(flight.departureTime),
      });

      flight.score =
        flight.duration * (carrier === flight.carrier ? 0.9 : 1) +
        flight.distance;

      if (
        (maxHours && maxHours <= flight.duration) ||
        (acceptableDepartTimeMin &&
          acceptableDepartTimeMin.valueOf() >=
            new Date(flight.departureTime).valueOf()) ||
        (acceptableDepartTimeMax &&
          acceptableDepartTimeMax.valueOf() <=
            new Date(flight.departureTime).valueOf())
      ) {
        filteredFlights.push(flight);
      }
    }
    return filteredFlights.length > 0
      ? filteredFlights.sort((a, b) => {
          return a.score - b.score;
        })
      : flights;
  }
}
