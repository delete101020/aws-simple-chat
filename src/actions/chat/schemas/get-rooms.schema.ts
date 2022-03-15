export default {
  type: 'object',
  properties: {
    options: {
      type: 'object',
      properties: {
        sorted: { type: 'boolean', default: true },
        limit: { type: 'number', default: 10 },
        exclusiveStartKey: { type: 'object', default: null },
      },
      additionalProperties: false,
    },
  },
  additionalProperties: false,
} as const;
