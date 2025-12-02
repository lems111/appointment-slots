import { Type } from '@sinclair/typebox';
export const SlotSchema = Type.Object({
    id: Type.String(),
    start: Type.String({ format: 'date-time' }),
    end: Type.String({ format: 'date-time' }),
    booked: Type.Boolean(),
    bookedBy: Type.Optional(Type.String({ format: 'email' })),
    createdAt: Type.String({ format: 'date-time' }),
});
export const SlotResponseSchema = Type.Object({
    id: Type.String(),
    start: Type.String({ format: 'date-time' }),
    end: Type.String({ format: 'date-time' }),
    booked: Type.Boolean(),
    bookedBy: Type.Optional(Type.String({ format: 'email' })),
});
export const SlotQueryStringSchema = Type.Object({
    from: Type.Optional(Type.String({ format: 'date-time' })),
    to: Type.Optional(Type.String({ format: 'date-time' })),
    booked: Type.Optional(Type.Boolean()),
});
export const SlotCreateRequestSchema = Type.Object({
    start: Type.String({ format: 'date-time' }),
    end: Type.String({ format: 'date-time' }),
});
export const SlotBookRequestSchema = Type.Object({
    email: Type.String({ format: 'email' }),
});
