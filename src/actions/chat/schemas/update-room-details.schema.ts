export default {
  type: 'object',
  properties: {
    roomId: { type: 'string' },
    name: { type: 'string' },
  },
  required: ['roomId', 'name'],
  additionalProperties: false,
} as const;
