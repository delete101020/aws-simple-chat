export default {
  type: 'object',
  properties: {
    roomId: { type: 'string' },
    messageId: { type: 'string' },
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
  required: ['roomId', 'messageId', 'messageData'],
  additionalProperties: false,
} as const;
