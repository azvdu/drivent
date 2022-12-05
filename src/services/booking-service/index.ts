import { notFoundError } from "@/errors";
import bookingRepository from "@/repositories/bookings-repository";
import enrollmentRepository from "@/repositories/enrollment-repository";
import ticketRepository from "@/repositories/ticket-repository";

async function getBookings(userId: number) {
  const enrollments = await enrollmentRepository.findWithAddressByUserId(userId);
  if(!enrollments) {
    throw notFoundError();
  }
  const ticket = await ticketRepository.findTickeWithTypeById(enrollments.id);
  if(!ticket || ticket.TicketType.includesHotel !== true || ticket.TicketType.isRemote !== true || ticket.status === "RESERVED") {
    throw notFoundError();
  }
  const bookingList = await bookingRepository.findBooking(userId);
  return {
    id: bookingList.id,
    Room: bookingList.Room
  };
}

async function createBooking(userId: number, roomId: number) {
  await getBookings(userId);
  
  const userBooking = await bookingRepository.findBooking(userId);
  if(userBooking) {
    throw notFoundError();
  }
  const newbooking = bookingRepository.createBooking(userId, roomId);
  return newbooking;
}

const bookingService = {
  getBookings,
  createBooking,
};

export default bookingService;
