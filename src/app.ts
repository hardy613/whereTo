import axios from "axios";
import express from "express";
import csv from "csvtojson";
import haversine from "haversine";
import path from "node:path";
const app = express();

const axiosInstance = axios.create();

type Flight = {
  departureTime: string;
  arrivalTime: string;
  carrier: string;
  origin: string;
  destination: string;
  score?: number;
  distance: {
    mile: number;
  };
};

app.get("/", async ({ query }, res) => {
  const {
    carrier = "",
    maxHours,
    acceptableDepartTimeStart = "",
    acceptableDepartTimeEnd = "",
  } = query;

  const airports = await csv({ noheader: true }).fromFile(
    path.resolve(__dirname, "./airports.csv")
  );

  const { data }: { data: Flight[] } = await axiosInstance(
    "https://gist.githubusercontent.com/bgdavidx/132a9e3b9c70897bc07cfa5ca25747be/raw/8dbbe1db38087fad4a8c8ade48e741d6fad8c872/gistfile1.txt"
  );

  data
    .filter((flight) => {
      const departureTime = new Date(flight.departureTime);
      const timeInHours = Math.floor(
        new Date(flight.arrivalTime).valueOf() -
          new Date(flight.departureTime).valueOf() / (1000 * 60 * 60)
      );
      return (
        timeInHours <= Number(maxHours) &&
        new Date(acceptableDepartTimeStart as string).valueOf() <=
          departureTime.valueOf() &&
        new Date(acceptableDepartTimeEnd as string).valueOf() >=
          departureTime.valueOf()
      );
    })
    .sort((a, b) => {
      if (a.distance === undefined) {
        const { field7, field8 } = airports.find((airport) => {
          airport.field5 === a.origin;
        });
        const { field7: endField7, field8: endField8 } = airports.find(
          (airport) => {
            airport.field5 === a.destination;
          }
        );
        a.distance.mile = haversine(
          { lat: field7, lon: field8 },
          { lat: endField7, lon: endField8 },
          { unit: "mile" }
        );
      }

      if (a.score === undefined) {
        const score =
          Math.floor(
            new Date(a.arrivalTime).valueOf() -
              new Date(a.departureTime).valueOf() / (1000 * 60 * 60)
          ) * (carrier === a.carrier ? 0.9 : 1);
        a.score = score;
      }

      if (b.score === undefined) {
        const score =
          Math.floor(
            new Date(b.arrivalTime).valueOf() -
              new Date(b.departureTime).valueOf() / (1000 * 60 * 60)
          ) * (carrier === a.carrier ? 0.9 : 1);

        b.score = score;
      }

      return a.score - b.score;
    });

  res.send(data);
});

app.listen(3000, () => {
  console.log("listening on :3000");
});
