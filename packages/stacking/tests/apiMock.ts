// const mockIfMap = {};
import { MockResponseInitFunction } from 'jest-fetch-mock';

export const mockMatch = {
  ALL: /.*/,
};

// eslint-disable-next-line @typescript-eslint/require-await
export const apiMock: MockResponseInitFunction = async (request: Request) => {
  const url = (request as any)[Object.getOwnPropertySymbols(request)[1]].parsedURL; // may depend on js runtime

  console.log(`Mocked ${url.path}`);
  switch (url.path) {
    case '/v2/accounts/ST162GBCTD9ESBF09XC2T63NCX6ZKS42ZPWGXZ6VH?proof=0':
      return `{
        "balance": "0x00000000000000000000000000000000",
        "locked": "0x00000000000000000000000000000000",
        "unlock_height": 0,
        "nonce": 0
      }`;
    case '/v2/contracts/call-read/ST000000000000000000002AMW42H/pox-2/can-stack-stx':
      return `{
        "okay": true,
        "result": "0x08000000000000000000000000000000000b"
      }`;
    case '/v2/pox':
      return `{
        "contract_id": "ST000000000000000000002AMW42H.pox-2",
        "pox_activation_threshold_ustx": 600170395696278,
        "first_burnchain_block_height": 0,
        "current_burnchain_block_height": 11393,
        "prepare_phase_block_length": 1,
        "reward_phase_block_length": 4,
        "reward_slots": 8,
        "rejection_fraction": 3333333333333333,
        "total_liquid_supply_ustx": 60017039569627800,
        "current_cycle": {
          "id": 2278,
          "min_threshold_ustx": 1875540000000000,
          "stacked_ustx": 0,
          "is_pox_active": false
        },
        "next_cycle": {
          "id": 2279,
          "min_threshold_ustx": 1875540000000000,
          "min_increment_ustx": 7502129946203,
          "stacked_ustx": 0,
          "prepare_phase_start_block_height": 11394,
          "blocks_until_prepare_phase": 1,
          "reward_phase_start_block_height": 11395,
          "blocks_until_reward_phase": 2,
          "ustx_until_pox_rejection": 10420513817368210000
        },
        "min_amount_ustx": 1875540000000000,
        "prepare_cycle_length": 1,
        "reward_cycle_id": 2278,
        "reward_cycle_length": 5,
        "rejection_votes_left_required": 10420513817368210000,
        "next_reward_cycle_in": 2,
        "contract_versions": [
          {
          "contract_id": "ST000000000000000000002AMW42H.pox",
          "activation_burnchain_block_height": 0,
          "first_reward_cycle_id": 0
          },
          {
          "contract_id": "ST000000000000000000002AMW42H.pox-2",
          "activation_burnchain_block_height": 104,
          "first_reward_cycle_id": 21
          }
        ]
      }`;
  }
  console.log('TEST');
  return 'test';
};
