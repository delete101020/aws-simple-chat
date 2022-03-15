export default {
  type: 'object',
  properties: {
    roomId: { type: 'string' },
    removeUserId: { type: 'string' },
  },
  required: ['roomId', 'removeUserId'],
  additionalProperties: false,
} as const;
