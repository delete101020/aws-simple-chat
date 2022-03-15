export default {
  ConnectionsTable: {
    Type: 'AWS::DynamoDB::Table',
    Properties: {
      AttributeDefinitions: [
        {
          AttributeName: 'connectionId',
          AttributeType: 'S',
        },
        {
          AttributeName: 'userId',
          AttributeType: 'S',
        },
      ],
      KeySchema: [
        {
          AttributeName: 'connectionId',
          KeyType: 'HASH',
        },
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: '${self:custom.tableThroughput}',
        WriteCapacityUnits: '${self:custom.tableThroughput}',
      },
      TableName: '${self:provider.environment.DYNAMODB_CONNECTION_TABLE}',
      GlobalSecondaryIndexes: [
        {
          IndexName:
            '${self:provider.environment.DYNAMODB_CONNECTION_TABLE_USER_GSI}',
          KeySchema: [
            {
              AttributeName: 'userId',
              KeyType: 'HASH',
            },
          ],
          Projection: {
            ProjectionType: 'ALL',
          },
          ProvisionedThroughput: {
            ReadCapacityUnits: '${self:custom.tableThroughput}',
            WriteCapacityUnits: '${self:custom.tableThroughput}',
          },
        },
      ],
    },
  },

  ChatTable: {
    Type: 'AWS::DynamoDB::Table',
    Properties: {
      AttributeDefinitions: [
        {
          AttributeName: 'chatId',
          AttributeType: 'S',
        },
        {
          AttributeName: 'chatKey',
          AttributeType: 'S',
        },
        {
          AttributeName: 'updatedAt',
          AttributeType: 'N',
        },
      ],
      KeySchema: [
        {
          AttributeName: 'chatId',
          KeyType: 'HASH',
        },
        {
          AttributeName: 'chatKey',
          KeyType: 'RANGE',
        },
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: '${self:custom.tableThroughput}',
        WriteCapacityUnits: '${self:custom.tableThroughput}',
      },
      TableName: '${self:provider.environment.DYNAMODB_CHAT_TABLE}',
      GlobalSecondaryIndexes: [
        {
          IndexName:
            '${self:provider.environment.DYNAMODB_CHAT_TABLE_KEY_UPDATED_GSI}',
          KeySchema: [
            {
              AttributeName: 'chatKey',
              KeyType: 'HASH',
            },
            {
              AttributeName: 'updatedAt',
              KeyType: 'RANGE',
            },
          ],
          Projection: {
            ProjectionType: 'ALL',
          },
          ProvisionedThroughput: {
            ReadCapacityUnits: '${self:custom.tableThroughput}',
            WriteCapacityUnits: '${self:custom.tableThroughput}',
          },
        },
      ],
    },
  },
};
