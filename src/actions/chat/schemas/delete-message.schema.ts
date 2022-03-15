export default {
  type: 'object',
  properties: {
    roomId: { type: 'string' },
    messageId: { type: 'string' },
  },
  required: ['roomId', 'messageId'],
  additionalProperties: false,
} as const;
