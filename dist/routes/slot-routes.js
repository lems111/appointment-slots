import { Type } from '@sinclair/typebox';
import { SlotQueryStringSchema, SlotResponseSchema, SlotCreateRequestSchema, SlotBookRequestSchema } from '../types/slot-types.js';
import { listSlots, createSlot, bookSlot, deleteSlot, getAvailableSlots } from '../services/slot-service.js';
const slotRoutes = (server, options, done) => {
    // Get available slots handler
    const getAvailableSlotsHandler = async (request, reply) => {
        try {
            request.log.trace(request.query);
            const slots = await getAvailableSlots(request.query);
            return reply.code(200).send(slots); // Return slots;
        }
        catch (err) {
            if (err instanceof Error) {
                return reply.code(400).send({ message: err.message });
            }
            return reply.code(400).send({ message: 'Unknown error' });
        }
    };
    server.get('/slots/availability', {
        schema: {
            querystring: SlotQueryStringSchema,
            response: {
                200: Type.Array(SlotResponseSchema)
            }
        },
        handler: getAvailableSlotsHandler
    });
    // delete slot handler
    const deleteSlotHandler = async (request, reply) => {
        try {
            const slot = await deleteSlot(request.params.id);
            return reply.code(204).send(null);
        }
        catch (err) {
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
    };
    server.delete('/slots/:id', {
        schema: {
            params: Type.Object({ id: Type.String({ format: 'uuid' }) }),
            response: {
                204: Type.Null()
            }
        },
        handler: deleteSlotHandler
    });
    const getSlotsHandler = async (request) => {
        const slots = await listSlots(request.query);
        return slots;
    };
    server.get('/slots', {
        schema: {
            querystring: SlotQueryStringSchema,
            response: {
                200: Type.Array(SlotResponseSchema)
            }
        },
        handler: getSlotsHandler,
    });
    const createSlotHandler = async (request, reply) => {
        try {
            const slot = await createSlot(request.body);
            return reply.code(201).send(slot); // Return the created slot;
        }
        catch (err) {
            if (err instanceof Error) {
                return reply.code(400).send({ message: err.message });
            }
            return reply.code(400).send({ message: 'Unknown error' });
        }
    };
    server.post('/slots', {
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
    request, reply) => {
        try {
            const slot = await bookSlot(request.params.id, request.body.email);
            return reply.code(200).send(slot);
        }
        catch (err) {
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
    };
    server.post('/slots/:id/book', {
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
export default slotRoutes;
