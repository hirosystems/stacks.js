import { utf8ToBytes } from '@stacks/common';
import { Address, addressToString } from '../../common';
import { LengthPrefixedString, createAddress, createLPString } from '../../postcondition-types';
import { ClarityType } from '../constants';

type PrincipalCV = StandardPrincipalCV | ContractPrincipalCV;

interface StandardPrincipalCV {
  readonly type: ClarityType.PrincipalStandard;
  readonly address: Address;
}

interface ContractPrincipalCV {
  readonly type: ClarityType.PrincipalContract;
  readonly address: Address;
  readonly contractName: LengthPrefixedString;
}
/** Returns a string in the format `address` or `address.contract-name` from a principal (standard or contract) */
function principalToString(principal: PrincipalCV): string {
  if (principal.type === ClarityType.PrincipalStandard) {
    return addressToString(principal.address);
  } else if (principal.type === ClarityType.PrincipalContract) {
    const address = addressToString(principal.address);
    return `${address}.${principal.contractName.content}`;
  } else {
    throw new Error(`Unexpected principal data: ${JSON.stringify(principal)}`);
  }
}

function principalCV(principal: string): PrincipalCV {
  if (principal.includes('.')) {
    const [address, contractName] = principal.split('.');
    return contractPrincipalCV(address, contractName);
  } else {
    return standardPrincipalCV(principal);
  }
}

/**
 * Converts stx address in to StandardPrincipalCV clarity type
 * @param {addressString} string value to be converted to StandardPrincipalCV clarity type
 * @returns {StandardPrincipalCV} returns instance of type StandardPrincipalCV
 *
 * @example
 * ```
 *  import { standardPrincipalCV } from '@stacks/transactions';
 *
 *  const addr = standardPrincipalCV('SP2JXKMSH007NPYAQHKJPQMAQYAD90NQGTVJVQ02B');
 *  // { type: 5, address: { type: 0, version: 22, hash160: 'a5d9d331000f5b79578ce56bd157f29a9056f0d6' } }
 * ```
 *
 * @see
 * {@link https://github.com/hirosystems/stacks.js/blob/main/packages/transactions/tests/clarity.test.ts | clarity test cases for more examples}
 */
function standardPrincipalCV(addressString: string): StandardPrincipalCV {
  const addr = createAddress(addressString);
  return { type: ClarityType.PrincipalStandard, address: addr };
}

/**
 * Converts stx address in to StandardPrincipalCV clarity type
 * @param {addressString} string value to be converted to StandardPrincipalCV clarity type
 * @returns {StandardPrincipalCV} returns instance of type StandardPrincipalCV
 *
 * @example
 * ```
 *  import { standardPrincipalCVFromAddress, Address  } from '@stacks/transactions';
 *
 *  const address: Address = {
 *    type: 0,
 *    version: 22,
 *    hash160: 'a5d9d331000f5b79578ce56bd157f29a9056f0d6'
 *  };
 *
 *  const principalCV = standardPrincipalCVFromAddress(address);
 *  // { type: 5, address: { type: 0, version: 22, hash160: 'a5d9d331000f5b79578ce56bd157f29a9056f0d6' } }
 * ```
 *
 * @see
 * {@link https://github.com/hirosystems/stacks.js/blob/main/packages/transactions/tests/clarity.test.ts | clarity test cases for more examples}
 */
function standardPrincipalCVFromAddress(address: Address): StandardPrincipalCV {
  return { type: ClarityType.PrincipalStandard, address };
}

/**
 * Converts stx address in to ContractPrincipalCV clarity type
 * @param {addressString} string value to be converted to ContractPrincipalCV clarity type
 * @param {contractName} string containing contract name
 * @returns {ContractPrincipalCV} returns instance of type ContractPrincipalCV
 *
 * @example
 * ```
 *  import { contractPrincipalCV } from '@stacks/transactions';
 *
 *  const contractAddress = contractPrincipalCV('SP2JXKMSH007NPYAQHKJPQMAQYAD90NQGTVJVQ02B', 'test');
 *  // { type: 6, address: { type: 0, version: 22, hash160: 'a5d9d331000f5b79578ce56bd157f29a9056f0d6' }, contractName: { type: 2, content: 'test', lengthPrefixBytes: 1, maxLengthBytes: 128 } }
 * ```
 *
 * @see
 * {@link https://github.com/hirosystems/stacks.js/blob/main/packages/transactions/tests/clarity.test.ts | clarity test cases for more examples}
 */
function contractPrincipalCV(addressString: string, contractName: string): ContractPrincipalCV {
  const addr = createAddress(addressString);
  const lengthPrefixedContractName = createLPString(contractName);
  return contractPrincipalCVFromAddress(addr, lengthPrefixedContractName);
}

/**
 * Create ContractPrincipalCV from Address type
 * @param {address} address value to be converted to ContractPrincipalCV clarity type
 * @param {contractName} contract name of type LengthPrefixedString
 * @returns {ContractPrincipalCV} returns instance of type ContractPrincipalCV
 *
 * @example
 * ```
 *  import { contractPrincipalCVFromAddress, createLPString, createAddress } from '@stacks/transactions';
 *
 *  const contractAddressCV = contractPrincipalCVFromAddress(createAddress('SP2JXKMSH007NPYAQHKJPQMAQYAD90NQGTVJVQ02B'), createLPString('test'));
 *
 *  // { type: 6, address: { type: 0, version: 22, hash160: 'a5d9d331000f5b79578ce56bd157f29a9056f0d6' }, contractName: { type: 2, content: 'test', lengthPrefixBytes: 1, maxLengthBytes: 128 } }
 * ```
 *
 * @see
 * {@link https://github.com/hirosystems/stacks.js/blob/main/packages/transactions/tests/clarity.test.ts | clarity test cases for more examples}
 */
function contractPrincipalCVFromAddress(
  address: Address,
  contractName: LengthPrefixedString
): ContractPrincipalCV {
  if (utf8ToBytes(contractName.content).byteLength >= 128) {
    throw new Error('Contract name must be less than 128 bytes');
  }
  return { type: ClarityType.PrincipalContract, address, contractName };
}

function contractPrincipalCVFromStandard(
  sp: StandardPrincipalCV,
  contractName: string
): ContractPrincipalCV {
  const lengthPrefixedContractName = createLPString(contractName);
  return {
    type: ClarityType.PrincipalContract,
    address: sp.address,
    contractName: lengthPrefixedContractName,
  };
}

export {
  PrincipalCV,
  StandardPrincipalCV,
  ContractPrincipalCV,
  principalCV,
  principalToString,
  standardPrincipalCV,
  standardPrincipalCVFromAddress,
  contractPrincipalCV,
  contractPrincipalCVFromAddress,
  contractPrincipalCVFromStandard,
};
