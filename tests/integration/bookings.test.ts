import app, { init } from "@/app";
import { prisma } from "@/config";
import { TicketStatus } from "@prisma/client";
import faker from "@faker-js/faker";
import httpStatus from "http-status";
import * as jwt from "jsonwebtoken";
import supertest from "supertest";
import { cleanDb, generateValidToken } from "../helpers";
import { createEnrollmentWithAddress, createHotel, createPayment, createRoomWithHotelId, createTicket, createTicketTypeRemote, createTicketTypeWithHotel, createUser, createBookings, createBookingWithRoomId, findBooking } from "../factories";

beforeAll(async () => {
  await init();
});

beforeEach(async () => {
  await cleanDb();
});

const server = supertest(app);

describe("GET /bookings", () => {
  it("should respond with status 401 if no token iss given", async () => {
    const result = await server.get("/bookings");

    expect(result.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if given token is not valid", async () => {
    const token = faker.lorem.word();

    const result = await server.get("/bookings").set("Authorization", `Bearer ${token}`);

    expect(result.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if there is no session for given token", async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

    const result = await server.get("/bookings").set("Authorization", `Bearer ${token}`);

    expect(result.status).toEqual(httpStatus.UNAUTHORIZED);
  });
});

describe("when token is valid", async () => {
  it("should respond with status 404 when user has no booking", async () => {
    const user = await createUser();
    const token = await generateValidToken(user);
    const enrollment = await createEnrollmentWithAddress(user);
    const ticketType = await createTicketTypeWithHotel();
    const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
    await createPayment(ticket.id, ticketType.price);

    const result = await  server.get("/bookings").set("Authorization", `Bearer ${token}`);

    expect(result.status).toEqual(httpStatus.NOT_FOUND);
  });

  it("should respond with status 200 and send booking data", async () => {
    const user = await createUser();
    const token = await generateValidToken(user);
    const enrollment = await createEnrollmentWithAddress(user);
    const ticketType = await createTicketTypeWithHotel();
    const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
    await createPayment(ticket.id, ticketType.price);
    const hotel = await createHotel();
    const room = await createRoomWithHotelId(hotel.id);
    const booking = await createBookingWithRoomId(user.id, room.id);
        
    const result = await server.get("/bookings").set("Authorization", `Bearer ${token}`);
        
    expect(result.status).toEqual(httpStatus.OK);
    expect(result.body).toEqual(
      {
        id: booking.id,
        Room: {
          id: room.id,
          name: room.name,
          capacity: room.capacity,
          hotelId: hotel.id,
          createdAt: room.createdAt.toISOString(),
          updatedAt: room.updatedAt.toISOString()
        }
      }
    );
  });
});

describe("POST /bookings", () => {
  it("should respond with status 401 if no token is given", async () => {
    const result = await server.post("/bookings");

    expect(result.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if given token is not valid", async () => {
    const token = faker.lorem.word();
      
    const result = await server.post("/bookings").set("Authorization", `Bearer ${token}`);
      
    expect(result.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if there is no session for given token", async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

    const result = await server.post("/bookings").set("Authorization", `Bearer ${token}`);

    expect(result.status).toEqual(httpStatus.UNAUTHORIZED);
  });
});

describe("when token is valid", () => {
  it("should respond with status 403 when body is not given", async () => {
    const user = await createUser();
    const token = await generateValidToken(user);
  
    const result = await server.post("/bookings").set("Authorization", `Bearer ${token}`);
        
    expect(result.status).toEqual(httpStatus.BAD_REQUEST);
  });

  it("should respond with status 403 when body is invalid", async () => {
    const user = await createUser();
    const token = await generateValidToken(user);
    const body = { [faker.lorem.word()]: faker.lorem.word };

    const result = await server.post("/bookings").set("Authorization", `Bearer ${token}`).send(body);
    expect(result.status).toEqual(httpStatus.BAD_REQUEST);
  });
  it("should respond with status 403 when user ticket is remote or is not paid", async () => {
    const user = await createUser();
    const token = await generateValidToken(user);
    const enrollment = await createEnrollmentWithAddress(user);
    const ticketType = await createTicketTypeRemote();
    const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);
    await createPayment(ticket.id, ticketType.price);
    const hotel = await createHotel();
    const rooom = await createRoomWithHotelId(hotel.id);

    const result = await server 
      .post("/bookings")
      .set("Authorization", `Bearer ${token}`)
      .send({ roomId: rooom.id });
        
    expect(result.status).toEqual(httpStatus.FORBIDDEN);
  });

  it("should respond with status 404 when user has no enrollment", async () => {
    const user = await createUser();
    const token = await generateValidToken(user);
    // const ticketType = await createTicketTypeRemote();

    const result = await server.post("/bookings").set("Authorization", `Bearer ${token}`);

    expect(result.status).toEqual(httpStatus.BAD_REQUEST);
  });

  it("should respond with status 404 when user has no ticket", async () => {
    const user = await createUser();
    const token = await generateValidToken(user);
    await createEnrollmentWithAddress(user);
    const checkTicket = { userId: user.id };

    const result = await server.post("/bookings").set("Authorization", `Bearer ${token}`).send(checkTicket);

    expect(result.status).toEqual(httpStatus.BAD_REQUEST);
  });

  it("should respond with status 404 when user has no booking", async () => {
    const user = await createUser();
    const token = await generateValidToken(user);
    const enrollment = await createEnrollmentWithAddress(user);
    const ticketType = await createTicketTypeWithHotel();
    const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
    await createPayment(ticket.id, ticketType.price);
    
    const result = await server.post("/bookings").set("Authorization", `Bearer ${token}`);
    
    expect(result.status).toEqual(httpStatus.BAD_REQUEST);
  });
    
  it("should respond with status 404 when room does not exist", async () => {
    const user = await createUser();
    const token = await generateValidToken(user);
    const enrollment = await createEnrollmentWithAddress(user);
    const ticketType = await createTicketTypeWithHotel();
    const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
    await createPayment(ticket.id, ticketType.price);
    const hotel = await createHotel();
    const room = await createRoomWithHotelId(hotel.id);
    const body = { userId: user.id, roomId: room.id+1 };

    const result = await server.post("/bookings").set("Authorization", `Bearer ${token}`).send(body);

    expect(result.status).toEqual(httpStatus.FORBIDDEN);
  });
    
  it("should respond with status 403 when invalid roomId", async () => {
    const user = await createUser();
    const token = await generateValidToken(user);
    const body = { roomId: -1 };
        
    const result = await server.post("/bookings").set("Authorization", `Bearer ${token}`).send(body);
    expect(result.status).toEqual(httpStatus.FORBIDDEN);
  });
    
  it("should respond with status 403 when room is full", async () => {
    const user = await createUser();
    const token = await generateValidToken(user);
    const enrollment = await createEnrollmentWithAddress(user);
    const ticketType = await createTicketTypeWithHotel();
    const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
    await createPayment(ticket.id, ticketType.price);
    const hotel = await createHotel();
    const room = await createRoomWithHotelId(hotel.id);
    await createBookings(room.id);
    const body = { roomId: room.id };

    const result = await server.post("/bookings").set("Authorization", `Bearer ${token}`).send(body);
    expect(result.status).toEqual(httpStatus.FORBIDDEN);
  });

  it("should respond with status 200 with booking id when valid roomId", async () => {
    const user = await createUser();
    const token = await generateValidToken(user);
    const enrollment = await createEnrollmentWithAddress(user);
    const ticketType = await createTicketTypeWithHotel();
    const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
    await createPayment(ticket.id, ticketType.price);
    const hotel = await createHotel();
    const room = await createRoomWithHotelId(hotel.id);
    const body = { roomId: room.id };
    const booking = await findBooking(user.id, room.id);
        
    const result = await server.post("/bookings").set("Authorization", `Bearer ${token}`).send(body);

    expect(result.status).toEqual(httpStatus.OK);
    expect(result.body).toEqual({
      id: booking.id
    });
  });
});

describe("PUT /bookings/:bookingId", () => {
  it("should respond with status 401 if no token is given", async () => {
    const result = await server.put("/bookings/3");

    expect(result.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if there is no session for given token", async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign( { userId: userWithoutSession.id }, process.env.JWT_SECRET);

    const result = await server.put("/bookings/3").set("Authorization", `Bearer ${token}`);
    expect(result.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if token is not valid", async () => {
    const token = faker.lorem.word();

    const result = await server.put("/bookings/3").set("Authorization", `Bearer ${token}`);
    expect(result.status).toBe(httpStatus.UNAUTHORIZED);
  });
});
describe("when token is valid", () => {
  it("should respond with status 403 when body is not given", async () => {
    const user = await createUser();
    const token = await generateValidToken(user);

    const result = await server.post("/bookings/3").set("Authorization", `Bearer ${token}`);
    expect(result.status).toEqual(httpStatus.FORBIDDEN);
  });

  it("should respond with status 403 when room is full", async () => {
    const user = await createUser();
    const token = await generateValidToken(user);
    const enrollment = await createEnrollmentWithAddress(user);
    const ticketType = await createTicketTypeWithHotel();
    const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
    await createPayment(ticket.id, ticketType.price);
    const hotel = await createHotel();
    const room = await createRoomWithHotelId(hotel.id);
    await createBookings(room.id);
    const body = { roomId: room.id };

    const result = await server.post("/bookings/3").set("Authorization", `Bearer ${token}`).send(body);
    expect(result.status).toEqual(httpStatus.FORBIDDEN);
  });

  it("should respond with status 403 when invalid roomId is given", async () => {
    const user = await createUser();
    const token = await generateValidToken(user);
    const body = { roomId: -1 };
  
    const result = await server.put("/bookings/2").set("Authorization", `Bearer ${token}`).send(body);
  
    expect(result.status).toEqual(httpStatus.FORBIDDEN);
  });

  it("should respond with status 200 when valid roomid and bookingId", async () => {
    const user = await createUser();
    const token = await generateValidToken(user);
    const hotel = await createHotel();
    const room = await createRoomWithHotelId(hotel.id);
    const userBooking = await createBookingWithRoomId(user.id, room.id);
    const booking = await prisma.booking.findUnique({
      where: {
        id: userBooking.id
      }
    });
    const newRoom = await createRoomWithHotelId(hotel.id);
    const body = { roomId: newRoom.id };

    const result = await server
      .put(`bookings/${userBooking.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send(body);

    expect(result.status).toEqual(httpStatus.OK);
    expect(booking.roomId).toEqual(newRoom.id);
  });
});
