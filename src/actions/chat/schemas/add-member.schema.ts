export default {
  type: 'object',
  properties: {
    roomId: { type: 'string' },
    participantIds: { type: 'array', items: { type: 'string' } },
  },
  required: ['roomId'],
  additionalProperties: false,
} as const;
