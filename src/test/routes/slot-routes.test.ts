import { test } from 'node:test';
import { equal } from 'node:assert/strict'
import server from '../../server.js';

const RESOURCE_URI = '/slots';

test(`${RESOURCE_URI}`, async (t) => {
  t.before(async () => {
    await server.ready();
  });

  t.after(async () => {
    await server.close()
  })

  const res = await server.inject({
    method: 'GET',
    url: RESOURCE_URI
  });

  equal(res.statusCode, 200);
  equal(res.headers['content-type'], 'application/json; charset=utf-8');
  const allSlots = JSON.parse(res.payload);

  equal(Array.isArray(allSlots), true);

  const unbookedRes = await server.inject({
    method: 'GET',
    url: `${RESOURCE_URI}?booked=false`
  });

  equal(unbookedRes.statusCode, 200);
  equal(res.headers['content-type'], 'application/json; charset=utf-8');
  const unbookedSlots = JSON.parse(unbookedRes.payload);

  equal(Array.isArray(unbookedSlots), true);

  for (const slot of unbookedSlots) {
    equal(slot.booked, false);
  }

  const invalidRangeRes = await server.inject({
    method: 'POST',
    url: `${RESOURCE_URI}`,
    payload: {
      start: '2023-01-01T04:00:00.000Z',
      end: '2023-01-01T02:00:00.000Z'
    },
  });

  // Check error is returned with 400 status code
  equal(invalidRangeRes.statusCode, 400);

  const invalidTimeslotRes = await server.inject({
    method: 'POST',
    url: `${RESOURCE_URI}`,
    payload: {
      start: '2023-01-01T04:00:00.000Z',
      end: '2023-01-01T04:10:00.000Z'
    },
  });

  equal(invalidTimeslotRes.statusCode, 400);

  const createRes = await server.inject({
    method: 'POST',
    url: `${RESOURCE_URI}`,
    payload: {
      start: '2023-01-01T04:00:00.000Z',
      end: '2023-01-01T06:00:00.000Z'
    },
  });

  equal(createRes.statusCode, 201);

  const overlapRes = await server.inject({
    method: 'POST',
    url: `${RESOURCE_URI}`,
    payload: {
      start: '2023-01-01T04:30:00.000Z',
      end: '2023-01-01T05:30:00.000Z'
    },
  });

  equal(overlapRes.statusCode, 400);

  const notFoundRes = await server.inject({
    method: 'POST',
    url: `${RESOURCE_URI}/c28dfc81-b333-4ff1-a21f-1f7e9bb4b220/book`,
    payload: {
      email: 'sarah.jennings@example.com'
    }
  });

  // Slot not found
  equal(notFoundRes.statusCode, 404);

  const alreadyBookedRes = await server.inject({
    method: 'POST',
    url: `${RESOURCE_URI}/c28dfc81-b333-4ff1-a21f-1f7e9bb4b219/book`,
    payload: {
      email: 'sarah.jennings@example.com'
    }
  });

  // Slot not found
  equal(alreadyBookedRes.statusCode, 409);

  const invalidEmailRes = await server.inject({
    method: 'POST',
    url: `${RESOURCE_URI}/e7af1bb4-1cd9-4476-8bb2-cf0998b2d35d/book`,
    payload: {
      email: 'sarah'
    }
  });

  // Slot not found
  equal(invalidEmailRes.statusCode, 400);

  const bookedRes = await server.inject({
    method: 'POST',
    url: `${RESOURCE_URI}/e7af1bb4-1cd9-4476-8bb2-cf0998b2d35d/book`,
    payload: {
      email: 'sarah.jennings@example.com'
    }
  });

  equal(bookedRes.statusCode, 200);

  // Slot not found
  const deleteNotFoundRes = await server.inject({
    method: 'DELETE',
    url: `${RESOURCE_URI}/e7af1bb4-1cd9-4476-8bb2-cf0998b2d399`,
  });

  // Slot booked found
  equal(deleteNotFoundRes.statusCode, 404);

  const deleteBookedRes = await server.inject({
    method: 'DELETE',
    url: `${RESOURCE_URI}/8b7e1f13-ea93-4cd1-84ad-7a8303c1d512`,
  });

  // Slot deleted
  equal(deleteBookedRes.statusCode, 409);

  const deleteSlotRes = await server.inject({
    method: 'DELETE',
    url: `${RESOURCE_URI}/f91c4c88-5d55-41be-a49f-6bc0d5f89e71`,
  });

  equal(deleteSlotRes.statusCode, 204);

  // Missing Availability From and To
  const missingFromToRes = await server.inject({
    method: 'GET',
    url: `${RESOURCE_URI}/availability?from=2025-11-25T09:00:00Z`,
  })

  equal(missingFromToRes.statusCode, 400);

  const getAvailabilityRes = await server.inject({
    method: 'GET',
    url: `${RESOURCE_URI}/availability?from=2025-11-25T09:00:00Z&to=2025-11-25T17:00:00Z`,
  })

  equal(getAvailabilityRes.statusCode, 200);
  const availability = JSON.parse(getAvailabilityRes.payload);

  equal(Array.isArray(availability), true);

  for (const slot of availability) {
    equal(slot.booked, false);
  }

});

