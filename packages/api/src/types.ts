export type BaseRejection = {
  error: string;
  reason: string;
  txid: string;
};

export type SerializationRejection = {
  reason: 'Serialization';
  reason_data: {
    message: string;
  };
} & BaseRejection;

export type DeserializationRejection = {
  reason: 'Deserialization';
  reason_data: {
    message: string;
  };
} & BaseRejection;

export type SignatureValidationRejection = {
  reason: 'SignatureValidation';
  reason_data: {
    message: string;
  };
} & BaseRejection;

export type BadNonceRejection = {
  reason: 'BadNonce';
  reason_data: {
    expected: number;
    actual: number;
    is_origin: boolean;
    principal: boolean;
  };
} & BaseRejection;

export type FeeTooLowRejection = {
  reason: 'FeeTooLow';
  reason_data: {
    expected: number;
    actual: number;
  };
} & BaseRejection;

export type NotEnoughFundsRejection = {
  reason: 'NotEnoughFunds';
  reason_data: {
    expected: string;
    actual: string;
  };
} & BaseRejection;

export type NoSuchContractRejection = {
  reason: 'NoSuchContract';
} & BaseRejection;

export type NoSuchPublicFunctionRejection = {
  reason: 'NoSuchPublicFunction';
};

export type BadFunctionArgumentRejection = {
  reason: 'BadFunctionArgument';
  reason_data: {
    message: string;
  };
} & BaseRejection;

export type ContractAlreadyExistsRejection = {
  reason: 'ContractAlreadyExists';
  reason_data: {
    contract_identifier: string;
  };
} & BaseRejection;

export type PoisonMicroblocksDoNotConflictRejection = {
  reason: 'PoisonMicroblocksDoNotConflict';
} & BaseRejection;

export type PoisonMicroblockHasUnknownPubKeyHashRejection = {
  reason: 'PoisonMicroblockHasUnknownPubKeyHash';
} & BaseRejection;

export type PoisonMicroblockIsInvalidRejection = {
  reason: 'PoisonMicroblockIsInvalid';
} & BaseRejection;

export type BadAddressVersionByteRejection = {
  reason: 'BadAddressVersionByte';
} & BaseRejection;

export type NoCoinbaseViaMempoolRejection = {
  reason: 'NoCoinbaseViaMempool';
} & BaseRejection;

export type ServerFailureNoSuchChainTipRejection = {
  reason: 'ServerFailureNoSuchChainTip';
} & BaseRejection;

export type ServerFailureDatabaseRejection = {
  reason: 'ServerFailureDatabase';
  reason_data: {
    message: string;
  };
} & BaseRejection;

export type ServerFailureOtherRejection = {
  reason: 'ServerFailureOther';
  reason_data: {
    message: string;
  };
} & BaseRejection;

export type TxBroadcastResultOk = {
  txid: string;
};

export type TxBroadcastResultRejected =
  | SerializationRejection
  | DeserializationRejection
  | SignatureValidationRejection
  | BadNonceRejection
  | FeeTooLowRejection
  | NotEnoughFundsRejection
  | NoSuchContractRejection
  | NoSuchPublicFunctionRejection
  | BadFunctionArgumentRejection
  | ContractAlreadyExistsRejection
  | PoisonMicroblocksDoNotConflictRejection
  | PoisonMicroblockHasUnknownPubKeyHashRejection
  | PoisonMicroblockIsInvalidRejection
  | BadAddressVersionByteRejection
  | NoCoinbaseViaMempoolRejection
  | ServerFailureNoSuchChainTipRejection
  | ServerFailureDatabaseRejection
  | ServerFailureOtherRejection;

export type TxBroadcastResult = TxBroadcastResultOk | TxBroadcastResultRejected;
