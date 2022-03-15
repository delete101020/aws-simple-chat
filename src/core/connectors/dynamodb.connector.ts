import {
  BatchGetItemInput,
  BatchGetItemOutput,
  BatchWriteItemInput,
  BatchWriteItemOutput,
  DeleteItemInput,
  DeleteItemOutput,
  DocumentClient,
  GetItemInput,
  GetItemOutput,
  PutItemInput,
  PutItemOutput,
  QueryInput,
  QueryOutput,
  ScanInput,
  ScanOutput,
  UpdateItemInput,
  UpdateItemOutput,
} from 'aws-sdk/clients/dynamodb';
import { DYNAMODB_OPTIONS, LOCAL_DYNAMODB_OPTIONS } from '@core/constants';

export enum QueryType {
  QUERY = 'Query',
  SCAN = 'Scan',
  BATCH_GET_ITEM = 'BatchGetItem',
  BATCH_WRITE_ITEM = 'BatchWriteItem',
  BATCH_DELETE_ITEM = 'BatchDeleteItem',
  GET_ITEM = 'GetItem',
  PUT_ITEM = 'PutItem',
  UPDATE_ITEM = 'UpdateItem',
  DELETE_ITEM = 'DeleteItem',
}

export type QueryInputType =
  | QueryInput
  | ScanInput
  | BatchGetItemInput
  | BatchWriteItemInput
  | GetItemInput
  | PutItemInput
  | UpdateItemInput
  | DeleteItemInput;

export type QueryOutputType<T> = T extends QueryInput
  ? QueryOutput
  : T extends ScanInput
  ? ScanOutput
  : T extends BatchGetItemInput
  ? BatchGetItemOutput
  : T extends BatchWriteItemInput
  ? BatchWriteItemOutput
  : T extends GetItemInput
  ? GetItemOutput
  : T extends PutItemInput
  ? PutItemOutput
  : T extends UpdateItemInput
  ? UpdateItemOutput
  : T extends DeleteItemInput
  ? DeleteItemOutput
  : never;

export class DynamoDBConnector {
  private _options: DocumentClient.DocumentClientOptions;
  private static _instance: DynamoDBConnector;
  private _documentClient: DocumentClient;

  constructor() {
    this._options = process.env.IS_OFFLINE
      ? LOCAL_DYNAMODB_OPTIONS
      : DYNAMODB_OPTIONS;

    this._documentClient = new DocumentClient(this._options);
  }

  public static getInstance() {
    if (!DynamoDBConnector._instance) {
      DynamoDBConnector._instance = new DynamoDBConnector();
    }

    return DynamoDBConnector._instance;
  }

  /** =================================================================== */

  async batchWriteItem(params: BatchWriteItemInput) {
    return await this._documentClient.batchWrite(params).promise();
  }

  async query(params: QueryInput) {
    return await this._documentClient.query(params).promise();
  }

  async scan(params: ScanInput) {
    return await this._documentClient.scan(params).promise();
  }

  async getItem(params: GetItemInput) {
    return await this._documentClient.get(params).promise();
  }

  async batchGetItem(params: BatchGetItemInput) {
    return await this._documentClient.batchGet(params).promise();
  }

  async putItem(params: PutItemInput) {
    return await this._documentClient.put(params).promise();
  }

  async updateItem(params: UpdateItemInput) {
    return await this._documentClient.update(params).promise();
  }

  async deleteItem(params: DeleteItemInput) {
    return await this._documentClient.delete(params).promise();
  }
}
