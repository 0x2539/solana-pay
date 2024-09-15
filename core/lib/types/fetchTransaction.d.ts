import type { Commitment, Connection, GetLatestBlockhashConfig, PublicKey } from '@solana/web3.js';
import { Transaction } from '@solana/web3.js';
/**
 * Thrown when a transaction response can't be fetched.
 */
export declare class FetchTransactionError extends Error {
    name: string;
}
/**
 * Fetch a transaction from a Solana Pay transaction request link.
 *
 * @param connection - A connection to the cluster.
 * @param account - Account that may sign the transaction.
 * @param link - `link` in the [Solana Pay spec](https://github.com/solana-labs/solana-pay/blob/master/SPEC.md#link).
 * @param options - Options for `getLatestBlockhash`.
 *
 * @throws {FetchTransactionError}
 */
export declare function fetchTransaction(connection: Connection, account: PublicKey, link: string | URL, { commitment }?: {
    commitment?: Commitment | GetLatestBlockhashConfig;
}): Promise<Transaction>;
//# sourceMappingURL=fetchTransaction.d.ts.map