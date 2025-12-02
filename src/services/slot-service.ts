import type { Slot, SlotResponse, SlotQueryString, SlotCreateRequest, SlotBookRequest } from "../types/slot-types.js";
// Use UUID to create a new id
import { v4 as uuidv4 } from 'uuid';

// In a real app, this would fetch data from a database
let allSlots: Array<Slot> = [
  {
    id: 'a1f3e8c2-3456-4b92-9c01-32e6ae91a101',
    start: '2025-11-25T09:00:00.000Z',
    end: '2025-11-25T09:30:00.000Z',
    booked: false,
    createdAt: '2025-11-20T10:02:11.000Z',
  },

  {
    id: 'c28dfc81-b333-4ff1-a21f-1f7e9bb4b219',
    start: '2025-11-25T10:00:00.000Z',
    end: '2025-11-25T10:30:00.000Z',
    booked: true,
    bookedBy: 'sarah.jennings@example.com',
    createdAt: '2025-11-20T10:05:42.000Z',
  },

  {
    id: 'e7af1bb4-1cd9-4476-8bb2-cf0998b2d35d',
    start: '2025-11-25T11:00:00.000Z',
    end: '2025-11-25T11:15:00.000Z', // 15-minute slot
    booked: false,
    createdAt: '2025-11-20T10:06:12.000Z',
  },

  {
    id: 'f91c4c88-5d55-41be-a49f-6bc0d5f89e71',
    start: '2025-11-25T14:00:00.000Z',
    end: '2025-11-25T14:30:00.000Z', // matches your example pattern
    booked: false,
    createdAt: '2025-11-20T10:07:40.000Z',
  },

  {
    id: '8b7e1f13-ea93-4cd1-84ad-7a8303c1d512',
    start: '2025-11-25T15:00:00.000Z',
    end: '2025-11-25T16:00:00.000Z', // 60-minute slot
    booked: true,
    bookedBy: 'kevin.donaldson@example.com',
    createdAt: '2025-11-20T10:08:03.000Z',
  },
];


// Get Slot availability in 30 minute slots between start and end times (9am - 5pm)
export async function getAvailableSlots(query: SlotQueryString): Promise<Array<SlotResponse>> {
  if (query.from === undefined || query.to === undefined)
    throw new Error('Missing from or to');
  else {
    const { from, to } = query;
    const slots = allSlots.filter((slot) => {
      const startTime = new Date(slot.start).getTime();
      const endTime = new Date(slot.end).getTime();
      const queryStartTime = new Date(from).getTime();
      const queryEndTime = new Date(to).getTime();
      return startTime >= queryStartTime && endTime <= queryEndTime && !slot.booked;
    });

    // return slots in 30 minute window
    let availableSlots: Array<SlotResponse> = [];
    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];
      const slotStartTime = new Date(slot.start).getTime();
      const slotEndTime = new Date(slot.end).getTime();
      const slotDuration = slotEndTime - slotStartTime;
      const slotDurationMinutes = slotDuration / 1000 / 60;

      // only iterate over 30 minute slots
      if (slotDurationMinutes % 30 !== 0)
        continue;

      for (let j = 0; j < slotDurationMinutes; j += 30) {
        const start = new Date(slotStartTime + j * 60 * 1000);
        const end = new Date(slotStartTime + (j + 30) * 60 * 1000);
        const slotResponse: SlotResponse = {

          id: slot.id,
          start: start.toISOString(),
          end: end.toISOString(),
          booked: slot.booked,
        }
        availableSlots.push(slotResponse);
      }
    }

    return availableSlots;
  }
}
// Delete a slot
export async function deleteSlot(id: string) {
  const slot = allSlots.find((slot) => slot.id === id);

  if (!slot)
    throw new Error('Slot not found');

  // Check if not booked
  if (slot.booked)
    throw new Error('Slot is already booked');

  allSlots = allSlots.filter((slot) => slot.id !== id);
}

// Book a slot
export async function bookSlot(id: string, email: string): Promise<SlotResponse> {
  // email must look valid
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new Error('Invalid email');

  const slot = allSlots.find((slot) => slot.id === id);
  if (!slot)
    throw new Error('Slot not found');

  if (slot.booked)
    throw new Error('Slot is already booked');


  slot.booked = true;
  slot.bookedBy = email;
  return slot;
}
export async function createSlot(body: SlotCreateRequest): Promise<SlotResponse> {
  const { start, end } = body;
  const startTime = new Date(start).getTime();
  const endTime = new Date(end).getTime();

  if (startTime > endTime)
    throw new Error('Start time must be before end time');

  // Slot must be exactly 15, 30, or 60 minutes
  const duration = (endTime - startTime) / 1000 / 60;
  if (duration % 15 !== 0 && duration % 30 !== 0 && duration % 60 !== 0)
    throw new Error('Slot must be 15, 30, or 60 minutes');

  // Slot cannot overlap an existing slot
  if (allSlots.some((existingSlot) => {
    const existingStartTime = new Date(existingSlot.start).getTime();
    const existingEndTime = new Date(existingSlot.end).getTime();
    return startTime < existingEndTime && endTime > existingStartTime;
  }))
    throw new Error('Slot cannot overlap an existing slot');

  const newSlot: Slot = {
    id: uuidv4(),
    start,
    end,
    booked: false,
    createdAt: new Date().toISOString(),
  };

  allSlots.push(newSlot);

  return {
    id: newSlot.id,
    start: newSlot.start,
    end: newSlot.end,
    booked: newSlot.booked,
  };
}
export async function listSlots(query: SlotQueryString): Promise<Array<SlotResponse>> {
  const { from, to, booked } = query;
  const fromTime = from !== undefined ? new Date(from).getTime() : undefined;
  const toTime = to !== undefined ? new Date(to).getTime() : undefined;

  const filteredSlots = allSlots
    .filter((slot) => {
      const startTime = new Date(slot.start).getTime();

      if ((fromTime !== undefined && startTime < fromTime) || (toTime !== undefined && startTime > toTime))
        return false;

      if (booked !== undefined && slot.booked !== booked)
        return false;

      return true;
    })
    .sort((a, b) => {
      return new Date(a.start).getTime() - new Date(b.start).getTime();
    })

  return filteredSlots;
}
