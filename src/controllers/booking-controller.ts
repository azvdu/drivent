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
    return res.sendStatus(httpStatus.UNAUTHORIZED);
  }
}

export async function updateBooking(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;
  const roomId = Number(req.body.roomId);
  const bookingId = Number(req.params.bookingId);

  try {
    if(!roomId || !bookingId) {
      return res.sendStatus(httpStatus.BAD_REQUEST);
    }
    const booking = await bookingService.updateBooking(bookingId, roomId, userId);
    return res.status(httpStatus.OK).send({ id: booking.id });
  } catch (error) {
    return res.sendStatus(httpStatus.UNAUTHORIZED);
  }
}
