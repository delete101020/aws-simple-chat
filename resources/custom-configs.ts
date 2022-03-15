export default {
  esbuild: {
    bundle: true,
    minify: false,
    sourcemap: true,
    exclude: ['aws-sdk'],
    target: 'node14',
    define: { 'require.resolve': undefined },
    platform: 'node',
    concurrency: 10,
  },
  tableThroughputs: {
    prod: 5,
    default: 1,
  },
  tableThroughput:
    '${self:custom.tableThroughputs.${self:provider.stage}, self:custom.tableThroughputs.default}',
  dynamodb: {
    start: {
      port: 8000,
      inMemory: true,
      migrate: true,
    },
    stages: ['${self:provider.stage}'],
  },
};
