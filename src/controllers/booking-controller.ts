import { AuthenticatedRequest } from "@/middlewares";
import { Response } from "express";
import httpStatus from "http-status";

import bookingService from "@/services/booking-service";

export async function getBookings(req: AuthenticatedRequest, res: Response) {
  try {
    const { userId } = req;
    if(!userId) {
      return res.sendStatus(httpStatus.BAD_REQUEST);
    }
    const bookings = await bookingService.getBookings(userId);
    if(!bookings) {
      return res.sendStatus(httpStatus.NOT_FOUND);
    }
    return res.status(httpStatus.OK).send(bookings);
  } catch (error) {
    return res.sendStatus(httpStatus.NOT_FOUND);
  }
}
