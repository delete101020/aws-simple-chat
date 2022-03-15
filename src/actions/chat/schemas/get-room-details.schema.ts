export default {
  type: 'object',
  properties: {
    roomId: { type: 'string' },
  },
  required: ['roomId'],
  additionalProperties: false,
} as const;
