export default {
  type: 'object',
  properties: {
    partnerId: { type: 'string' },
  },
  required: ['partnerId'],
  additionalProperties: false,
} as const;
