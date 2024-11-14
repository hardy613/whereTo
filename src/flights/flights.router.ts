import { Router } from "express";
import { FlightsController } from "./flights.controller";

/** Custom router can be injected */
export class FlightsRouter {
  private readonly flightsController: FlightsController;

  constructor(private readonly router = Router()) {
    this.flightsController = new FlightsController();
  }

  forRoot() {
    return this.router.get("/", this.flightsController.findByQuery());
  }
}
