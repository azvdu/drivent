import { Router } from "express";
import { authenticateToken } from "@/middlewares";
import { getBookings, postBooking, updateBooking } from "@/controllers/booking-controller";

const bookingRouter = Router();
bookingRouter
  .all("/*", authenticateToken)
  .get("/", getBookings)
  .post("/", postBooking)
  .put("/", updateBooking);

export { bookingRouter };
