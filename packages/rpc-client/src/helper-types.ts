import type { operations, paths } from './schema';

type Extract200Response<T> = T extends { 200: infer R } ? R : never;
type ExtractOperationResponse<T extends keyof operations> = Extract200Response<
  operations[T]['responses']
> extends { content: { 'application/json': infer U } }
  ? U
  : never;
type PathResponse<T extends keyof paths> = paths[T]['get'] extends { responses: infer R }
  ? Extract200Response<R> extends { content: { 'application/json': infer U } }
    ? U
    : never
  : paths[T]['post'] extends { responses: infer R }
  ? Extract200Response<R> extends { content: { 'application/json': infer U } }
    ? U
    : never
  : never;

/** Response types for a given endpoint path or operation name */
export type OperationResponse = {
  [K in keyof operations]: ExtractOperationResponse<K>;
} & {
  [P in keyof paths]: PathResponse<P>;
};

export type PoxResponse = OperationResponse['/v2/pox'];
export type InfoResponse = OperationResponse['/v2/info'];
export type AccountResponse = OperationResponse['/v2/accounts/{principal}'];
export type TransactionFeeResponse = OperationResponse['/v2/fees/transaction'];
export type ContractSourceResponse =
  OperationResponse['/v2/contracts/source/{contract_address}/{contract_name}'];
export type ContractInterfaceResponse =
  OperationResponse['/v2/contracts/interface/{contract_address}/{contract_name}'];
