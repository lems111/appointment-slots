import type { FastifyPluginCallback, FastifyReply, FastifyRequest } from 'fastify';
import { Type } from '@sinclair/typebox'
import type { SlotQueryString, SlotResponse, SlotCreateRequest, SlotBookRequest } from '../types/slot-types.js';
import { SlotQueryStringSchema, SlotResponseSchema, SlotCreateRequestSchema, SlotBookRequestSchema } from '../types/slot-types.js';
import { listSlots, createSlot, bookSlot, deleteSlot, getAvailableSlots } from '../services/slot-service.js';

const slotRoutes: FastifyPluginCallback = (server, options, done) => {

  // Get available slots handler
  const getAvailableSlotsHandler = async (
    request: FastifyRequest<{ Querystring: SlotQueryString }>,
    reply: FastifyReply
  ) => {
    try {
      request.log.trace(request.query);
      const slots = await getAvailableSlots(request.query);
      return reply.code(200).send(slots); // Return slots;
    } catch (err: Error | any) {
      if (err instanceof Error) {
        return reply.code(400).send({ message: err.message });
      }
      return reply.code(400).send({ message: 'Unknown error' });
    }
  }

  server.get<{ Querystring: SlotQueryString, Reply: SlotResponse[] }>('/slots/availability', {
    schema: {
      querystring: SlotQueryStringSchema,
      response: {
        200: Type.Array(SlotResponseSchema)
      }
    },
    handler: getAvailableSlotsHandler
  })
  // delete slot handler
  const deleteSlotHandler = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    try {
      const slot = await deleteSlot(request.params.id);
      return reply.code(204).send(null);
    } catch (err: Error | any) {
      if (err instanceof Error) {
        // return 404 if not found
        if (err.message === 'Slot not found')
          return reply.code(404).send({ message: err.message });
        // return 409 if already booked
        else if (err.message === 'Slot is already booked')
          return reply.code(409).send({ message: err.message });
      }
      return reply.code(400).send({ message: 'Unknown error' });
    }
  }

  server.delete<{ Params: { id: string } }>('/slots/:id', {
    schema: {
      params: Type.Object({ id: Type.String({ format: 'uuid' }) }),
      response: {
        204: Type.Null()
      }
    },
    handler: deleteSlotHandler
  })

  const getSlotsHandler = async (
    request: FastifyRequest<{ Querystring: SlotQueryString }>
  ) => {
    const slots = await listSlots(request.query);
    return slots;
  };

  server.get<{ Querystring: SlotQueryString, Reply: SlotResponse[] }>('/slots', {
    schema: {
      querystring: SlotQueryStringSchema,
      response: {
        200: Type.Array(SlotResponseSchema)
      }
    },
    handler: getSlotsHandler,
  });

  const createSlotHandler = async (
    request: FastifyRequest<{ Body: SlotCreateRequest }>,
    reply: FastifyReply
  ) => {
    try {
      const slot = await createSlot(request.body);
      return reply.code(201).send(slot); // Return the created slot;
    } catch (err: Error | any) {
      if (err instanceof Error) {
        return reply.code(400).send({ message: err.message });
      }
      return reply.code(400).send({ message: 'Unknown error' });
    }
  }

  server.post<{ Body: SlotCreateRequest, Reply: SlotResponse }>('/slots', {
    schema: {
      body: SlotCreateRequestSchema,
      response: {
        201: SlotResponseSchema,
        400: Type.Object({ message: Type.String() })
      }
    },
    handler: createSlotHandler,
  });

  const bookSlotHandler = async (
    // Body has email of user and ID is part of the path slots/:id/book
    request: FastifyRequest<{ Body: SlotBookRequest, Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    try {
      const slot = await bookSlot(request.params.id, request.body.email);
      return reply.code(200).send(slot);
    } catch (err: Error | any) {
      if (err instanceof Error) {
        let statusCode = 400;
        // 1.	Slot must exist.
        if (err.message === 'Slot not found')
          statusCode = 404;
        // 2.	Slot must not already be booked.
        else if (err.message === 'Slot is already booked')
          statusCode = 409;
        // 3.	Email must look valid.
        else if (err.message === 'Invalid email')
          statusCode = 400;

        return reply.code(statusCode).send({ message: err.message });
      }
    }
  }

  server.post<{ Body: SlotBookRequest, Params: { id: string }, Reply: SlotResponse }>('/slots/:id/book', {
    schema: {
      params: Type.Object({ id: Type.String({ format: 'uuid' }) }),
      body: SlotBookRequestSchema,
      response: {
        200: SlotResponseSchema,
        400: Type.Object({ message: Type.String() })
      }
    },
    handler: bookSlotHandler,
  });
  done();
};

export default slotRoutes
