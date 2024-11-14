import express from "express";
import { FlightsRouter } from "./flights/flights.router";

const app = express();
/** here we could pass in DB connections instead of relying on the Router/controller/service to have one made */
app.use("/", new FlightsRouter().forRoot());

app.listen(3000, () => {
  console.log("listening on :3000");
});
