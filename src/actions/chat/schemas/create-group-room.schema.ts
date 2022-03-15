export default {
  type: 'object',
  properties: {
    participantIds: { type: 'array', items: { type: 'string' } },
  },
  additionalProperties: false,
} as const;
