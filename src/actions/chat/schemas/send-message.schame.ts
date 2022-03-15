export default {
  type: 'object',
  properties: {
    roomId: { type: 'string' },
    messageData: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        format: { type: 'string' },
        metadata: { type: 'object' },
      },
      required: ['message', 'format'],
      additionalProperties: false,
    },
  },
  required: ['roomId', 'messageData'],
  additionalProperties: false,
} as const;
