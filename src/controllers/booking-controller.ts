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

export async function postBooking(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;
  const roomId = Number(req.body.roomId);

  try {
    if(!roomId) {
      return res.sendStatus(httpStatus.BAD_REQUEST);
    }
    const newbooking = await bookingService.createBooking(userId, roomId);
    return res.status(httpStatus.OK).send({ id: newbooking.id });
  } catch (error) {
    return res.sendStatus(httpStatus.FORBIDDEN);
  }
}

// export async function updateBooking(req: AuthenticatedRequest, res: Response){
//   const { userId } = req;
//   const roomId = Number(req.body.roomId);
// }
