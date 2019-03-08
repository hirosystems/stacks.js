export declare const ERROR_CODES: {
    MISSING_PARAMETER: string;
    REMOTE_SERVICE_ERROR: string;
    INVALID_STATE: string;
    NO_SESSION_DATA: string;
    UNKNOWN: string;
};
declare type ErrorType = {
    code: string;
    parameter?: string;
    message: string;
};
export declare class BlockstackError extends Error {
    message: string;
    code: string;
    parameter?: string;
    constructor(error: ErrorType);
    toString(): string;
}
export declare class InvalidParameterError extends BlockstackError {
    constructor(parameter: string, message?: string);
}
export declare class MissingParameterError extends BlockstackError {
    constructor(parameter: string, message?: string);
}
export declare class RemoteServiceError extends BlockstackError {
    response: Response;
    constructor(response: Response, message?: string);
}
export declare class InvalidDIDError extends BlockstackError {
    constructor(message?: string);
}
export declare class NotEnoughFundsError extends BlockstackError {
    leftToFund: number;
    constructor(leftToFund: number);
}
export declare class InvalidAmountError extends BlockstackError {
    fees: number;
    specifiedAmount: number;
    constructor(fees: number, specifiedAmount: number);
}
export declare class LoginFailedError extends BlockstackError {
    constructor(reason: string);
}
export declare class SignatureVerificationError extends BlockstackError {
    constructor(reason: string);
}
export declare class InvalidStateError extends BlockstackError {
    constructor(message: string);
}
export declare class NoSessionDataError extends BlockstackError {
    constructor(message: string);
}
export {};
