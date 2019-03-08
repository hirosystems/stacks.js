"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ERROR_CODES = {
    MISSING_PARAMETER: 'missing_parameter',
    REMOTE_SERVICE_ERROR: 'remote_service_error',
    INVALID_STATE: 'invalid_state',
    NO_SESSION_DATA: 'no_session_data',
    UNKNOWN: 'unknown'
};
Object.freeze(exports.ERROR_CODES);
var BlockstackError = /** @class */ (function (_super) {
    __extends(BlockstackError, _super);
    function BlockstackError(error) {
        var _this = _super.call(this, error.message) || this;
        _this.message = error.message;
        _this.code = error.code;
        _this.parameter = error.parameter ? error.parameter : null;
        return _this;
    }
    BlockstackError.prototype.toString = function () {
        return _super.prototype.toString.call(this) + "\n    code: " + this.code + " param: " + (this.parameter ? this.parameter : 'n/a');
    };
    return BlockstackError;
}(Error));
exports.BlockstackError = BlockstackError;
var InvalidParameterError = /** @class */ (function (_super) {
    __extends(InvalidParameterError, _super);
    function InvalidParameterError(parameter, message) {
        if (message === void 0) { message = ''; }
        var _this = _super.call(this, { code: 'missing_parameter', message: message, parameter: '' }) || this;
        _this.name = 'MissingParametersError';
        return _this;
    }
    return InvalidParameterError;
}(BlockstackError));
exports.InvalidParameterError = InvalidParameterError;
var MissingParameterError = /** @class */ (function (_super) {
    __extends(MissingParameterError, _super);
    function MissingParameterError(parameter, message) {
        if (message === void 0) { message = ''; }
        var _this = _super.call(this, { code: exports.ERROR_CODES.MISSING_PARAMETER, message: message, parameter: parameter }) || this;
        _this.name = 'MissingParametersError';
        return _this;
    }
    return MissingParameterError;
}(BlockstackError));
exports.MissingParameterError = MissingParameterError;
var RemoteServiceError = /** @class */ (function (_super) {
    __extends(RemoteServiceError, _super);
    function RemoteServiceError(response, message) {
        if (message === void 0) { message = ''; }
        var _this = _super.call(this, { code: exports.ERROR_CODES.REMOTE_SERVICE_ERROR, message: message }) || this;
        _this.response = response;
        return _this;
    }
    return RemoteServiceError;
}(BlockstackError));
exports.RemoteServiceError = RemoteServiceError;
var InvalidDIDError = /** @class */ (function (_super) {
    __extends(InvalidDIDError, _super);
    function InvalidDIDError(message) {
        if (message === void 0) { message = ''; }
        var _this = _super.call(this, { code: 'invalid_did_error', message: message }) || this;
        _this.name = 'InvalidDIDError';
        return _this;
    }
    return InvalidDIDError;
}(BlockstackError));
exports.InvalidDIDError = InvalidDIDError;
var NotEnoughFundsError = /** @class */ (function (_super) {
    __extends(NotEnoughFundsError, _super);
    function NotEnoughFundsError(leftToFund) {
        var _this = this;
        var message = "Not enough UTXOs to fund. Left to fund: " + leftToFund;
        _this = _super.call(this, { code: 'not_enough_error', message: message }) || this;
        _this.leftToFund = leftToFund;
        _this.name = 'NotEnoughFundsError';
        _this.message = message;
        return _this;
    }
    return NotEnoughFundsError;
}(BlockstackError));
exports.NotEnoughFundsError = NotEnoughFundsError;
var InvalidAmountError = /** @class */ (function (_super) {
    __extends(InvalidAmountError, _super);
    function InvalidAmountError(fees, specifiedAmount) {
        var _this = this;
        var message = "Not enough coin to fund fees transaction fees. Fees would be " + fees + ","
            + (" specified spend is  " + specifiedAmount);
        _this = _super.call(this, { code: 'invalid_amount_error', message: message }) || this;
        _this.specifiedAmount = specifiedAmount;
        _this.fees = fees;
        _this.name = 'InvalidAmountError';
        _this.message = message;
        return _this;
    }
    return InvalidAmountError;
}(BlockstackError));
exports.InvalidAmountError = InvalidAmountError;
var LoginFailedError = /** @class */ (function (_super) {
    __extends(LoginFailedError, _super);
    function LoginFailedError(reason) {
        var _this = this;
        var message = "Failed to login: " + reason;
        _this = _super.call(this, { code: 'login_failed', message: message }) || this;
        _this.message = message;
        _this.name = 'LoginFailedError';
        return _this;
    }
    return LoginFailedError;
}(BlockstackError));
exports.LoginFailedError = LoginFailedError;
var SignatureVerificationError = /** @class */ (function (_super) {
    __extends(SignatureVerificationError, _super);
    function SignatureVerificationError(reason) {
        var _this = this;
        var message = "Failed to verify signature: " + reason;
        _this = _super.call(this, { code: 'signature_verification_failure', message: message }) || this;
        _this.message = message;
        _this.name = 'SignatureVerificationError';
        return _this;
    }
    return SignatureVerificationError;
}(BlockstackError));
exports.SignatureVerificationError = SignatureVerificationError;
var InvalidStateError = /** @class */ (function (_super) {
    __extends(InvalidStateError, _super);
    function InvalidStateError(message) {
        var _this = _super.call(this, { code: exports.ERROR_CODES.INVALID_STATE, message: message }) || this;
        _this.message = message;
        _this.name = 'InvalidStateError';
        return _this;
    }
    return InvalidStateError;
}(BlockstackError));
exports.InvalidStateError = InvalidStateError;
var NoSessionDataError = /** @class */ (function (_super) {
    __extends(NoSessionDataError, _super);
    function NoSessionDataError(message) {
        var _this = _super.call(this, { code: exports.ERROR_CODES.INVALID_STATE, message: message }) || this;
        _this.message = message;
        _this.name = 'NoSessionDataError';
        return _this;
    }
    return NoSessionDataError;
}(BlockstackError));
exports.NoSessionDataError = NoSessionDataError;
//# sourceMappingURL=errors.js.map