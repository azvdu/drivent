import { prisma } from "@/config";

async function findBooking(userId: number) {
  return prisma.booking.findFirst({
    where: {
      userId: userId
    },
    include: {
      Room: true,
    }
  });
}

async function createBooking(userId: number, roomId: number) {
  return prisma.booking.create({
    data: {
      userId,
      roomId
    }
  });
}

async function findBookingId(bookingId: number) {
  return prisma.booking.findFirst({
    where: {
      id: bookingId
    }
  });
}

async function updateBooking(bookingId: number, roomId: number) {
  return prisma.booking.update({
    where: {
      id: bookingId
    },
    data: {
      roomId
    }
  });
}

const bookingRepository = {
  findBooking,
  createBooking,
  findBookingId,
  updateBooking
};

export default bookingRepository;
