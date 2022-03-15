import type { AWS } from '@serverless/typescript';

import {
  customConfigs,
  dynamoDBTables,
  iamPolicyStatements,
  lambdaEnvironments,
} from './resources';

import hello from '@functions/hello';
import {
  authHandler,
  connectHandler,
  disconnectHandler,
  defaultHandler,
} from '@actions/default';
import chatHandler from '@actions/chat';

const serverlessConfiguration: AWS = {
  service: 'aws-simple-chat',
  frameworkVersion: '3',

  useDotenv: true,
  disabledDeprecations: ['CLI_OPTIONS_SCHEMA'],

  plugins: [
    'serverless-esbuild',
    'serverless-dotenv-plugin',
    'serverless-dynamodb-local',
    'serverless-offline',
  ],

  provider: {
    name: 'aws',
    runtime: 'nodejs14.x',
    stage: "${opt:stage, 'dev'}",
    region: 'ap-southeast-2',
    versionFunctions: false,
    websocketsApiName:
      '${self:service}-apigw-websocket-${opt:stage, self:provider.stage}',
    // custom routes are selected by the value of the route property in the body
    websocketsApiRouteSelectionExpression: '$request.body.route',
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
    },
    environment: lambdaEnvironments,
    iam: {
      role: {
        statements: iamPolicyStatements,
      },
    },
  },

  resources: {
    Resources: dynamoDBTables,
  },

  // import the function via paths
  functions: {
    hello,

    /** ==================== Websocket ==================== */

    authHandler,
    connectHandler,
    disconnectHandler,
    defaultHandler,

    chatHandler,

    /** ==================== Websocket ==================== */
  },
  package: { individually: true },

  custom: customConfigs,
};

module.exports = serverlessConfiguration;
