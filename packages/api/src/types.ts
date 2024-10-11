import type { ContractIdString } from '@stacks/transactions';

export interface V2CoreInfoResponse {
  burn_block_height: number;
  stable_pox_consensus: string;
}

export interface CycleInfoResponse {
  id: number;
  min_threshold_ustx: number;
  stacked_ustx: number;
  is_pox_active: boolean;
}

export interface ContractVersionResponse {
  contract_id: ContractIdString;
  activation_burnchain_block_height: number;
  first_reward_cycle_id: number;
}

export interface V2PoxInfoResponse {
  contract_id: string;
  contract_versions: ContractVersionResponse[];
  current_burnchain_block_height?: number;
  first_burnchain_block_height: number;
  min_amount_ustx: string;
  next_reward_cycle_in: number;
  prepare_cycle_length: number;
  prepare_phase_block_length: number;
  rejection_fraction: number;
  rejection_votes_left_required: number;
  reward_cycle_id: number;
  reward_cycle_length: number;
  reward_phase_block_length: number;
  reward_slots: number;
  current_cycle: CycleInfoResponse;
  next_cycle: CycleInfoResponse & {
    min_increment_ustx: number;
    prepare_phase_start_block_height: number;
    blocks_until_prepare_phase: number;
    reward_phase_start_block_height: number;
    blocks_until_reward_phase: number;
    ustx_until_pox_rejection: number;
  };
}

export interface V1InfoBlockTimesResponse {
  mainnet: {
    target_block_time: number;
  };
  testnet: {
    target_block_time: number;
  };
}

export interface ExtendedAccountBalancesResponse {
  stx: {
    balance: string;
    total_sent: string;
    total_received: string;
    locked: string;
    lock_tx_id: string;
    lock_height: number;
    burnchain_lock_height: number;
    burnchain_unlock_height: number;
  };
  fungible_tokens: any;
  non_fungible_tokens: any;
}

export interface ExtendedAccountBalances {
  stx: {
    balance: bigint;
    total_sent: bigint;
    total_received: bigint;
    locked: bigint;
    lock_tx_id: string;
    lock_height: number;
    burnchain_lock_height: number;
    burnchain_unlock_height: number;
  };
  fungible_tokens: any;
  non_fungible_tokens: any;
}

export interface PaginationOptions {
  limit: number;
  offset: number;
}

export interface BaseErrorResponse {
  error: string;
}
