export default {
  type: 'object',
  properties: {
    roomId: { type: 'string' },
    options: {
      type: 'object',
      properties: {
        sorted: { type: 'boolean', default: true },
        limit: { type: 'number', default: 10 },
        exclusiveStartKey: { type: 'object', default: null },
      },
    },
  },
  required: ['roomId'],
  additionalProperties: false,
} as const;
