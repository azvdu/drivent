import { prisma } from "@/config";

async function findBooking(userId: number) {
  return prisma.booking.findFirst({
    where: {
      id: userId
    },
    include: {
      Room: true,
    }
  });
}

const bookingRepository = {
  findBooking
};

export default bookingRepository;
