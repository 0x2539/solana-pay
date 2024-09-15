"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchTransaction = exports.FetchTransactionError = void 0;
const web3_js_1 = require("@solana/web3.js");
const cross_fetch_1 = __importDefault(require("cross-fetch"));
const js_base64_1 = require("js-base64");
const tweetnacl_1 = __importDefault(require("tweetnacl"));
/**
 * Thrown when a transaction response can't be fetched.
 */
class FetchTransactionError extends Error {
    constructor() {
        super(...arguments);
        this.name = 'FetchTransactionError';
    }
}
exports.FetchTransactionError = FetchTransactionError;
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
function fetchTransaction(connection, account, link, { commitment } = {}) {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield (0, cross_fetch_1.default)(String(link), {
            method: 'POST',
            mode: 'cors',
            cache: 'no-cache',
            credentials: 'omit',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ account }),
        });
        const json = yield response.json();
        if (!(json === null || json === void 0 ? void 0 : json.transaction))
            throw new FetchTransactionError('missing transaction');
        if (typeof json.transaction !== 'string')
            throw new FetchTransactionError('invalid transaction');
        const transaction = web3_js_1.Transaction.from((0, js_base64_1.toUint8Array)(json.transaction));
        const { signatures, feePayer, recentBlockhash } = transaction;
        if (signatures.length) {
            if (!feePayer)
                throw new FetchTransactionError('missing fee payer');
            if (!feePayer.equals(signatures[0].publicKey))
                throw new FetchTransactionError('invalid fee payer');
            if (!recentBlockhash)
                throw new FetchTransactionError('missing recent blockhash');
            // A valid signature for everything except `account` must be provided.
            const message = transaction.serializeMessage();
            for (const { signature, publicKey } of signatures) {
                if (signature) {
                    if (!tweetnacl_1.default.sign.detached.verify(message, signature, publicKey.toBuffer()))
                        throw new FetchTransactionError('invalid signature');
                }
                else if (publicKey.equals(account)) {
                    // If the only signature expected is for `account`, ignore the recent blockhash in the transaction.
                    if (signatures.length === 1) {
                        transaction.recentBlockhash = (yield connection.getLatestBlockhash(commitment)).blockhash;
                    }
                }
                else {
                    throw new FetchTransactionError('missing signature');
                }
            }
        }
        else {
            // Ignore the fee payer and recent blockhash in the transaction and initialize them.
            transaction.feePayer = account;
            transaction.recentBlockhash = (yield connection.getLatestBlockhash(commitment)).blockhash;
        }
        return transaction;
    });
}
exports.fetchTransaction = fetchTransaction;
//# sourceMappingURL=fetchTransaction.js.map