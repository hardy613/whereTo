import { Request, Response } from "express";
import { FlightsService } from "./flights.service";

export class FlightsController {
  private readonly flightsService: FlightsService;

  constructor() {
    this.flightsService = new FlightsService();
  }

  public getFlightsData() {
    return async (
      {
        query: {
          carrier = "",
          maxHours = "",
          acceptableDepartTimeMin = "",
          acceptableDepartTimeMax = "",
        },
      }: Request,
      res: Response
    ) => {
      try {
        const data = await this.flightsService.findByQuery({
          carrier: carrier.length ? String(carrier) : undefined,
          maxHours: maxHours.length ? Number(maxHours) : undefined,
          acceptableDepartTimeMin: acceptableDepartTimeMin.length
            ? new Date(String(acceptableDepartTimeMin))
            : undefined,
          acceptableDepartTimeMax: acceptableDepartTimeMax.length
            ? new Date(String(acceptableDepartTimeMax))
            : undefined,
        });
        res.send(data);
      } catch (e) {
        console.error(e);
        res.status(500).send("Internal server error");
      }
      return;
    };
  }
}
