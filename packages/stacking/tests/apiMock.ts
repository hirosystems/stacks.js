import fetchMock, { MockResponseInitFunction } from 'jest-fetch-mock';

// todo: something similar could be generalized to work in all package tests
export function enableApiMocks(responseMap: { [key: string]: any }) {
  // eslint-disable-next-line @typescript-eslint/require-await
  fetchMock.mockIf(MOCK_MATCH.ALL, (async (request: Request) => {
    const { path } = (request as any)[Object.getOwnPropertySymbols(request)[1]].parsedURL; // may depend on js runtime

    // not sure if this falls through to next mocker
    if (!responseMap.hasOwnProperty(path)) {
      return console.log(`☐ Not mocking '${path}'`);
    }

    console.log(`☑︎ Mocking '${path}'`);
    const response = responseMap[path as string];

    if (typeof response === 'string') return response;
    return JSON.stringify(response);
  }) as MockResponseInitFunction);
}

export const MOCK_MATCH = {
  ALL: /.*/,
};

export const MOCK_2_1_PERIOD1_MAINNET = {
  // doesn't have `contract_versions` array
  '/v2/pox': `{"contract_id":"SP000000000000000000002Q6VF78.pox","pox_activation_threshold_ustx":66818426279656,"first_burnchain_block_height":666050,"prepare_phase_block_length":100,"reward_phase_block_length":2000,"reward_slots":4000,"rejection_fraction":25,"total_liquid_supply_ustx":1336368525593131,"current_cycle":{"id":42,"min_threshold_ustx":140000000000,"stacked_ustx":528062660869340,"is_pox_active":true},"next_cycle":{"id":43,"min_threshold_ustx":120000000000,"min_increment_ustx":66818426279,"stacked_ustx":441243465796508,"prepare_phase_start_block_height":756250,"blocks_until_prepare_phase":182,"reward_phase_start_block_height":756350,"blocks_until_reward_phase":282,"ustx_until_pox_rejection":334092131398275},"min_amount_ustx":120000000000,"prepare_cycle_length":100,"reward_cycle_id":42,"reward_cycle_length":2100,"rejection_votes_left_required":334092131398275,"next_reward_cycle_in":282}`,
};

export const MOCK_2_1_PERIOD1_REGTEST = {
  // has `contract_versions` array, but not distinguishable from period 2
  '/v2/pox': `{"contract_id":"ST000000000000000000002AMW42H.pox","pox_activation_threshold_ustx":600057388429055,"first_burnchain_block_height":0,"current_burnchain_block_height":108,"prepare_phase_block_length":1,"reward_phase_block_length":4,"reward_slots":8,"rejection_fraction":3333333333333333,"total_liquid_supply_ustx":60005738842905579,"current_cycle":{"id":21,"min_threshold_ustx":1875180000000000,"stacked_ustx":0,"is_pox_active":false},"next_cycle":{"id":22,"min_threshold_ustx":1875180000000000,"min_increment_ustx":7500717355363,"stacked_ustx":0,"prepare_phase_start_block_height":109,"blocks_until_prepare_phase":1,"reward_phase_start_block_height":110,"blocks_until_reward_phase":2,"ustx_until_pox_rejection":8484139029839119787},"min_amount_ustx":1875180000000000,"prepare_cycle_length":1,"reward_cycle_id":21,"reward_cycle_length":5,"rejection_votes_left_required":8484139029839119787,"next_reward_cycle_in":2,"contract_versions":[{"contract_id":"ST000000000000000000002AMW42H.pox","activation_burnchain_block_height":0,"first_reward_cycle_id":0},{"contract_id":"ST000000000000000000002AMW42H.pox-2","activation_burnchain_block_height":120,"first_reward_cycle_id":25}]}`,
};

export const MOCK_2_1_PERIOD3_STACKS_TEL = {
  '/v2/pox': `{"contract_id":"ST000000000000000000002AMW42H.pox-2","pox_activation_threshold_ustx":600656914165569,"first_burnchain_block_height":0,"current_burnchain_block_height":60024,"prepare_phase_block_length":1,"reward_phase_block_length":4,"reward_slots":8,"rejection_fraction":3333333333333333,"total_liquid_supply_ustx":60065691416556970,"current_cycle":{"id":12004,"min_threshold_ustx":1877060000000000,"stacked_ustx":0,"is_pox_active":false},"next_cycle":{"id":12005,"min_threshold_ustx":1877060000000000,"min_increment_ustx":7508211427069,"stacked_ustx":0,"prepare_phase_start_block_height":60024,"blocks_until_prepare_phase":0,"reward_phase_start_block_height":60025,"blocks_until_reward_phase":1,"ustx_until_pox_rejection":2302791417015060000},"min_amount_ustx":1877060000000000,"prepare_cycle_length":1,"reward_cycle_id":12004,"reward_cycle_length":5,"rejection_votes_left_required":2302791417015060000,"next_reward_cycle_in":1,"contract_versions":[{"contract_id":"ST000000000000000000002AMW42H.pox","activation_burnchain_block_height":0,"first_reward_cycle_id":0},{"contract_id":"ST000000000000000000002AMW42H.pox-2","activation_burnchain_block_height":104,"first_reward_cycle_id":21}]}`,
};

const V2_POX_STACKS_TEL = `{"contract_id":"ST000000000000000000002AMW42H.pox-2","pox_activation_threshold_ustx":600666564165569,"first_burnchain_block_height":0,"current_burnchain_block_height":60989,"prepare_phase_block_length":1,"reward_phase_block_length":4,"reward_slots":8,"rejection_fraction":3333333333333333,"total_liquid_supply_ustx":60066656416556970,"current_cycle":{"id":12197,"min_threshold_ustx":1877090000000000,"stacked_ustx":0,"is_pox_active":false},"next_cycle":{"id":12198,"min_threshold_ustx":1877090000000000,"min_increment_ustx":7508332052069,"stacked_ustx":0,"prepare_phase_start_block_height":60989,"blocks_until_prepare_phase":0,"reward_phase_start_block_height":60990,"blocks_until_reward_phase":1,"ustx_until_pox_rejection":11416974460158247000},"min_amount_ustx":1877090000000000,"prepare_cycle_length":1,"reward_cycle_id":12197,"reward_cycle_length":5,"rejection_votes_left_required":11416974460158247000,"next_reward_cycle_in":1,"contract_versions":[{"contract_id":"ST000000000000000000002AMW42H.pox","activation_burnchain_block_height":0,"first_reward_cycle_id":0},{"contract_id":"ST000000000000000000002AMW42H.pox-2","activation_burnchain_block_height":104,"first_reward_cycle_id":21}]}`;
export const MOCK_EMPTY_ACCOUNT = {
  '/v2/pox': V2_POX_STACKS_TEL,
  '/v2/accounts/ST162GBCTD9ESBF09XC2T63NCX6ZKS42ZPWGXZ6VH?proof=0': `{"balance":"0x00000000000000000000000000000000","locked":"0x00000000000000000000000000000000","unlock_height":0,"nonce":0}`,
  '/v2/contracts/call-read/ST000000000000000000002AMW42H/pox-2/can-stack-stx': `{"okay":true,"result":"0x08000000000000000000000000000000000b"}`,
};
export const MOCK_FULL_ACCOUNT = {
  '/v2/pox': V2_POX_STACKS_TEL,
  '/v2/accounts/STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6?proof=0': `{"balance":"0x0000000000000000002386f26fb76310","locked":"0x00000000000000000000000000000000","unlock_height":0,"nonce":63}`,
  '/v2/contracts/call-read/ST000000000000000000002AMW42H/pox-2/can-stack-stx': `{"okay":true,"result":"0x0703"}`,
};
