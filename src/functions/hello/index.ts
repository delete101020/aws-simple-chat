import schema from './schema';
import { handlerPath } from '@libs/handler-resolver';

export default {
  name: 'API_${self:service}_hello_${self:provider.stage}',
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      http: {
        method: 'post',
        path: 'hello',
        request: {
          schemas: {
            'application/json': schema,
          },
        },
      },
    },
  ],
};
