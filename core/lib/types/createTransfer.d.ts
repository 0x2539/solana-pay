import type { Commitment, Connection, GetLatestBlockhashConfig, PublicKey } from '@solana/web3.js';
import { Transaction } from '@solana/web3.js';
import type { Amount, Memo, Recipient, References, SPLToken } from './types.js';
/**
 * Thrown when a Solana Pay transfer transaction can't be created from the fields provided.
 */
export declare class CreateTransferError extends Error {
    name: string;
}
/**
 * Fields of a Solana Pay transfer request URL.
 */
export interface CreateTransferFields {
    /** `recipient` in the [Solana Pay spec](https://github.com/solana-labs/solana-pay/blob/master/SPEC.md#recipient). */
    recipient: Recipient;
    /** `amount` in the [Solana Pay spec](https://github.com/solana-labs/solana-pay/blob/master/SPEC.md#amount). */
    amount: Amount;
    /** `spl-token` in the [Solana Pay spec](https://github.com/solana-labs/solana-pay/blob/master/SPEC.md#spl-token). */
    splToken?: SPLToken;
    /** `reference` in the [Solana Pay spec](https://github.com/solana-labs/solana-pay/blob/master/SPEC.md#reference). */
    reference?: References;
    /** `memo` in the [Solana Pay spec](https://github.com/solana-labs/solana-pay/blob/master/SPEC.md#memo). */
    memo?: Memo;
}
/**
 * Create a Solana Pay transfer transaction.
 *
 * @param connection - A connection to the cluster.
 * @param sender - Account that will send the transfer.
 * @param fields - Fields of a Solana Pay transfer request URL.
 * @param options - Options for `getLatestBlockhash`.
 *
 * @throws {CreateTransferError}
 */
export declare function createTransfer(connection: Connection, sender: PublicKey, { recipient, amount, splToken, reference, memo }: CreateTransferFields, { commitment }?: {
    commitment?: Commitment | GetLatestBlockhashConfig;
}): Promise<Transaction>;
//# sourceMappingURL=createTransfer.d.ts.map