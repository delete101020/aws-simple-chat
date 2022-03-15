import {
  AttributeValue,
  BatchGetItemInput,
  BatchWriteItemInput,
  DeleteItemInput,
  GetItemInput,
  Key,
  PutItemInput,
  QueryInput,
  ScanInput,
  UpdateItemInput,
} from 'aws-sdk/clients/dynamodb';
import {
  DynamoDBConnector,
  QueryInputType,
  QueryType,
} from '@core/connectors/dynamodb.connector';
import { isEmptyObject, isEmptyString } from '@core/utils/other.util';

export type ObjectType = { [key: string]: unknown };
export enum ComparisonOperator {
  EQ = 'EQ',
  LE = 'LE',
  LT = 'LT',
  GE = 'GE',
  GT = 'GT',
  BEGINS_WITH = 'BEGINS_WITH',
  BETWEEN = 'BETWEEN',
  IN = 'IN',
}
export type KeyCondition = {
  keyName: string;
  comparisonOperator: ComparisonOperator;
  attributeValueList: AttributeValue[];
};
export enum UpdateFunction {
  LIST_APPEND = 'LIST_APPEND',
}
export type FunctionUpdateField = {
  updateFunction: UpdateFunction;
  attributeName: string;
  attributeValue: AttributeValue;
};

export class DynamoDBQueryBuilder {
  private _queryType: QueryType;
  private _dynamoDBConnector: DynamoDBConnector;

  private _tableName: string;
  private _indexName: string;

  private _keys: Key[] = [];
  private _sortKeyConditions: KeyCondition[] = [];

  private _directUpdateFields: Record<string, unknown> = {};
  private _functionUpdateFields: FunctionUpdateField[] = [];

  private _filterFields: Record<string, unknown> = {};
  private _conditionFilterFields: KeyCondition[] = [];
  // private _projectionExpression: ProjectionExpression = 'ALL';

  private _limit: number;
  private _scanIndexForward: boolean;
  private _exclusiveStartKey: Key;

  constructor(queryType: QueryType) {
    this._queryType = queryType;
    this._dynamoDBConnector = DynamoDBConnector.getInstance();
  }

  public tableName(table: string) {
    this._tableName = table;

    return this;
  }

  public index(indexName: string): DynamoDBQueryBuilder {
    this._indexName = indexName;

    return this;
  }

  public key(key: Key | ObjectType): DynamoDBQueryBuilder {
    this._keys.push(key);

    return this;
  }

  public keys(keys: Key[]): DynamoDBQueryBuilder {
    this._keys.push(...keys);

    return this;
  }

  public sortKeyCondition(condition: KeyCondition): DynamoDBQueryBuilder {
    this._sortKeyConditions.push(condition);

    return this;
  }

  public updateFields(updateFields: {
    [key: string]: unknown;
  }): DynamoDBQueryBuilder {
    this._directUpdateFields = updateFields;

    return this;
  }

  public functionUpdateFields(
    fields: FunctionUpdateField[]
  ): DynamoDBQueryBuilder {
    this._functionUpdateFields = fields;

    return this;
  }

  public filterFields(filterFields: ObjectType): DynamoDBQueryBuilder {
    this._filterFields = Object.assign(this._filterFields, filterFields);

    return this;
  }

  public conditionFilterFields(condition: KeyCondition): DynamoDBQueryBuilder {
    this._conditionFilterFields.push(condition);

    return this;
  }

  // TODO: implement projectExpression
  // public projectionExpression(projectionExpression: string): DynamoDBQuery {
  //   this._projectionExpression = projectionExpression;

  //   return this;
  // }

  public limit(limit: number): DynamoDBQueryBuilder {
    this._limit = limit;

    return this;
  }

  public scanIndexForward(scanIndexForward: boolean): DynamoDBQueryBuilder {
    this._scanIndexForward = scanIndexForward;

    return this;
  }

  public exclusiveStartKey(exclusiveStartKey: Key): DynamoDBQueryBuilder {
    this._exclusiveStartKey = exclusiveStartKey;

    return this;
  }

  public build(): QueryInputType {
    switch (this._queryType) {
      case QueryType.QUERY:
        return this._buildQuery();
      case QueryType.SCAN:
        return this._buildScan();
      case QueryType.BATCH_GET_ITEM:
        return this._buildBatchGetItem();
      case QueryType.BATCH_WRITE_ITEM:
        return this._buildBatchWriteItem();
      case QueryType.BATCH_DELETE_ITEM:
        return this._buildBatchDeleteItem();
      case QueryType.GET_ITEM:
        return this._buildGetItem();
      case QueryType.PUT_ITEM:
        return this._buildPutItem();
      case QueryType.UPDATE_ITEM:
        return this._buildUpdateItem();
      case QueryType.DELETE_ITEM:
        return this._buildDeleteItem();
    }
  }

  public execute() {
    switch (this._queryType) {
      case QueryType.QUERY:
        return this._dynamoDBConnector.query(this._buildQuery());
      case QueryType.SCAN:
        return this._dynamoDBConnector.scan(this._buildScan());
      case QueryType.BATCH_GET_ITEM:
        return this._dynamoDBConnector.batchGetItem(this._buildBatchGetItem());
      case QueryType.BATCH_WRITE_ITEM:
        return this._dynamoDBConnector.batchWriteItem(
          this._buildBatchWriteItem()
        );
      case QueryType.BATCH_DELETE_ITEM:
        return this._dynamoDBConnector.batchWriteItem(
          this._buildBatchDeleteItem()
        );
      case QueryType.GET_ITEM:
        return this._dynamoDBConnector.getItem(this._buildGetItem());
      case QueryType.PUT_ITEM:
        return this._dynamoDBConnector.putItem(this._buildPutItem());
      case QueryType.UPDATE_ITEM:
        return this._dynamoDBConnector.updateItem(this._buildUpdateItem());
      case QueryType.DELETE_ITEM:
        return this._dynamoDBConnector.deleteItem(this._buildDeleteItem());
    }
  }

  /** =================================================================== */

  private _buildQuery(): QueryInput {
    const queryInput: QueryInput = {
      TableName: this._tableName,
      IndexName: this._indexName,
      Limit: this._limit,
      // ProjectionExpression: this._projectionExpression,
      ScanIndexForward: this._scanIndexForward,
      ExclusiveStartKey: this._exclusiveStartKey,
    };

    this._convertKeyCondition(queryInput);
    this._sortKeyConditionExpressions(queryInput);
    this._convertFilter(queryInput);
    this._conditionFilterExpression(queryInput);

    return queryInput;
  }

  private _buildScan(): ScanInput {
    const scanInput: ScanInput = {
      TableName: this._tableName,
      Limit: this._limit,
      // ProjectionExpression: this._projectionExpression,
      ExclusiveStartKey: this._exclusiveStartKey,
    };

    this._convertFilter(scanInput);
    this._conditionFilterExpression(scanInput);

    return scanInput;
  }

  private _buildBatchGetItem(): BatchGetItemInput {
    const batchGetItemInput: BatchGetItemInput = {
      RequestItems: {
        [this._tableName]: {
          Keys: this._keys,
        },
      },
    };

    return batchGetItemInput;
  }

  private _buildBatchWriteItem(): BatchWriteItemInput {
    const putRequests = this._keys.map((key) => {
      return {
        PutRequest: {
          Item: key,
        },
      };
    });

    const batchWriteItemInput: BatchWriteItemInput = {
      RequestItems: {
        [this._tableName]: putRequests,
      },
    };

    return batchWriteItemInput;
  }

  private _buildBatchDeleteItem(): BatchWriteItemInput {
    const deleteRequests = this._keys.map((key) => {
      return {
        DeleteRequest: {
          Key: key,
        },
      };
    });

    const batchWriteItemInput: BatchWriteItemInput = {
      RequestItems: {
        [this._tableName]: deleteRequests,
      },
    };

    return batchWriteItemInput;
  }

  private _buildGetItem(): GetItemInput {
    const getItemInput: GetItemInput = {
      TableName: this._tableName,
      Key: this._keys[0],
    };

    return getItemInput;
  }

  private _buildPutItem(): PutItemInput {
    const putItemInput: PutItemInput = {
      TableName: this._tableName,
      Item: this._keys[0],
    };

    return putItemInput;
  }

  private _buildUpdateItem(): UpdateItemInput {
    const updateItemInput: UpdateItemInput = {
      TableName: this._tableName,
      Key: this._keys[0],
      ReturnValues: 'ALL_NEW',
    };

    this._directUpdateExpressions(updateItemInput);
    this._functionUpdateExpressions(updateItemInput);

    return updateItemInput;
  }

  private _buildDeleteItem(): DeleteItemInput {
    const deleteItemInput: DeleteItemInput = {
      TableName: this._tableName,
      Key: this._keys[0],
    };

    return deleteItemInput;
  }

  private _convertKeyCondition(input: QueryInput) {
    if (!this._keys.length) return;

    if (!('KeyConditionExpression' in input)) input.KeyConditionExpression = '';

    if (!('ExpressionAttributeNames' in input))
      input.ExpressionAttributeNames = {};

    if (!('ExpressionAttributeValues' in input))
      input.ExpressionAttributeValues = {};

    // Partition keys
    this._keys.forEach((key) => {
      for (const keyName in key) {
        if (!isEmptyString(input.KeyConditionExpression))
          input.KeyConditionExpression += ' AND';
        input.KeyConditionExpression += ` #${keyName} = :${keyName}`;
        input.ExpressionAttributeNames[`#${keyName}`] = keyName as string;
        input.ExpressionAttributeValues[`:${keyName}`] = key[keyName];
      }
    });
  }

  private _sortKeyConditionExpressions(input: QueryInput) {
    if (!this._sortKeyConditions.length) return;

    if (!('KeyConditionExpression' in input)) input.KeyConditionExpression = '';

    if (!('ExpressionAttributeNames' in input))
      input.ExpressionAttributeNames = {};

    if (!('ExpressionAttributeValues' in input))
      input.ExpressionAttributeValues = {};

    this._sortKeyConditions.forEach((keyCondition) => {
      const {
        keyName,
        comparisonOperator: operator,
        attributeValueList,
      } = keyCondition;

      // TODO: create a specific function for Comparison Operator and Function Reference
      switch (operator) {
        case ComparisonOperator.EQ:
          break;
        case ComparisonOperator.GT:
          break;
        case ComparisonOperator.GE:
          break;
        case ComparisonOperator.LT:
          break;
        case ComparisonOperator.LE:
          break;
        case ComparisonOperator.BEGINS_WITH:
          if (!isEmptyString(input.KeyConditionExpression))
            input.KeyConditionExpression += ' AND';
          input.KeyConditionExpression += ` begins_with(#${keyName}, :${keyName})`;
          input.ExpressionAttributeNames[`#${keyName}`] = keyName;
          input.ExpressionAttributeValues[`:${keyName}`] =
            attributeValueList[0];
          break;
        case ComparisonOperator.BETWEEN:
          break;
      }
    });
  }

  private _convertFilter(input: QueryInput | ScanInput) {
    if (isEmptyObject(this._filterFields)) return;

    if (!('FilterExpression' in input)) input.FilterExpression = '';

    if (!('ExpressionAttributeNames' in input))
      input.ExpressionAttributeNames = {};

    if (!('ExpressionAttributeValues' in input))
      input.ExpressionAttributeValues = {};

    Object.entries(this._filterFields).forEach(([key, value]) => {
      if (!isEmptyString(input.FilterExpression))
        input.FilterExpression += ' AND';
      input.FilterExpression += ` #${key} = :${key}`;
      input.ExpressionAttributeNames[`#${key}`] = key as string;
      input.ExpressionAttributeValues[`:${key}`] = value;
    });
  }

  private _conditionFilterExpression(input: QueryInput | ScanInput) {
    if (!this._conditionFilterFields.length) return;

    if (!('FilterExpression' in input)) input.FilterExpression = '';

    if (!('ExpressionAttributeNames' in input))
      input.ExpressionAttributeNames = {};

    if (!('ExpressionAttributeValues' in input))
      input.ExpressionAttributeValues = {};

    this._conditionFilterFields.forEach((keyCondition) => {
      const {
        keyName,
        comparisonOperator: operator,
        attributeValueList,
      } = keyCondition;

      // TODO: create a specific function for Comparison Operator and Function Reference
      switch (operator) {
        case ComparisonOperator.IN:
          if (!isEmptyString(input.FilterExpression))
            input.FilterExpression += ' AND';

          input.ExpressionAttributeNames[`#${keyName}`] = keyName;
          const elements = [];
          attributeValueList.forEach((attributeValue, index) => {
            const attributeName = `:${keyName}${index + 1}`;
            elements.push(attributeName);
            input.ExpressionAttributeValues[attributeName] = attributeValue;
          });
          input.FilterExpression += ` #${keyName} IN (${elements.join(', ')})`;

          break;
      }
    });
  }

  private _directUpdateExpressions(input: UpdateItemInput) {
    if (isEmptyObject(this._directUpdateFields)) return;

    if (!('UpdateExpression' in input)) input.UpdateExpression = '';

    if (!('ExpressionAttributeNames' in input))
      input.ExpressionAttributeNames = {};

    if (!('ExpressionAttributeValues' in input))
      input.ExpressionAttributeValues = {};

    Object.entries(this._directUpdateFields).forEach(([key, value]) => {
      if (!isEmptyString(input.UpdateExpression)) input.UpdateExpression += ',';
      else input.UpdateExpression += 'SET';

      input.UpdateExpression += ` #${key} = :${key}`;
      input.ExpressionAttributeNames[`#${key}`] = key;
      input.ExpressionAttributeValues[`:${key}`] = value;
    });

    // Function update fields
  }

  private _functionUpdateExpressions(input: UpdateItemInput) {
    if (!this._functionUpdateFields.length) return;

    if (!('UpdateExpression' in input)) input.UpdateExpression = '';

    if (!('ExpressionAttributeNames' in input))
      input.ExpressionAttributeNames = {};

    if (!('ExpressionAttributeValues' in input))
      input.ExpressionAttributeValues = {};

    this._functionUpdateFields.forEach((updateField) => {
      if (!isEmptyString(input.UpdateExpression)) input.UpdateExpression += ',';
      else input.UpdateExpression += 'SET';

      const { updateFunction, attributeName, attributeValue } = updateField;

      // TODO: create a specific function for Update Expression with functions
      switch (updateFunction) {
        case UpdateFunction.LIST_APPEND: {
          input.UpdateExpression += ` ${attributeName} = list_append(#${attributeName}, :${attributeName})`;
          input.ExpressionAttributeNames[`#${attributeName}`] = attributeName;
          input.ExpressionAttributeValues[`:${attributeName}`] = attributeValue;
          break;
        }
      }
    });
  }
}
