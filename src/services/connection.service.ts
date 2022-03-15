import { GetItemOutput, Key, QueryOutput } from 'aws-sdk/clients/dynamodb';
import {
  DYNAMODB_CONNECTION_TABLE,
  DYNAMODB_CONNECTION_TABLE_USER_GSI,
} from '@core/constants';
import { DynamoDBQueryBuilder } from '@libs/query-builder';
import Connection from '@models/connection.model';
import { QueryType } from '@core/connectors/dynamodb.connector';

export class ConnectionService {
  private static _instance: ConnectionService;

  constructor() {}

  public static getInstance() {
    if (!ConnectionService._instance) {
      ConnectionService._instance = new ConnectionService();
    }

    return ConnectionService._instance;
  }

  /** =================================================================== */

  async createConnection(
    userId: string,
    connectionId: string
  ): Promise<Connection> {
    const connection = new Connection(connectionId, userId);
    const query = new DynamoDBQueryBuilder(QueryType.PUT_ITEM)
      .tableName(DYNAMODB_CONNECTION_TABLE)
      .key(connection.getEntityMappings() as unknown as Key);
    await query.execute();

    return connection;
  }

  // TODO(fix): A single Query operation can retrieve a maximum of 1 MB of data.
  async getConnections(userId: string) {
    const query = new DynamoDBQueryBuilder(QueryType.QUERY)
      .tableName(DYNAMODB_CONNECTION_TABLE)
      .index(DYNAMODB_CONNECTION_TABLE_USER_GSI)
      .key({ userId });
    const result = (await query.execute()) as QueryOutput;

    return result?.Items;
  }

  async getConnectionById(connectionId: string) {
    const query = new DynamoDBQueryBuilder(QueryType.GET_ITEM)
      .tableName(DYNAMODB_CONNECTION_TABLE)
      .key({ connectionId });
    const result = (await query.execute()) as GetItemOutput;

    return result.Item;
  }

  async deleteConnection(connectionId: string): Promise<void> {
    const query = new DynamoDBQueryBuilder(QueryType.DELETE_ITEM)
      .tableName(DYNAMODB_CONNECTION_TABLE)
      .key({ connectionId });
    await query.execute();
  }
}
