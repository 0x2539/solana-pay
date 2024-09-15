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
exports.validateTransfer = exports.ValidateTransferError = void 0;
const spl_token_1 = require("@solana/spl-token");
const web3_js_1 = require("@solana/web3.js");
const bignumber_js_1 = __importDefault(require("bignumber.js"));
const constants_js_1 = require("./constants.js");
/**
 * Thrown when a transaction doesn't contain a valid Solana Pay transfer.
 */
class ValidateTransferError extends Error {
    constructor() {
        super(...arguments);
        this.name = 'ValidateTransferError';
    }
}
exports.ValidateTransferError = ValidateTransferError;
/**
 * Check that a given transaction contains a valid Solana Pay transfer.
 *
 * @param connection - A connection to the cluster.
 * @param signature - The signature of the transaction to validate.
 * @param fields - Fields of a Solana Pay transfer request to validate.
 * @param options - Options for `getTransaction`.
 *
 * @throws {ValidateTransferError}
 */
function validateTransfer(connection, signature, { recipient, amount, splToken, reference, memo }, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield connection.getTransaction(signature, options);
        if (!response)
            throw new ValidateTransferError('not found');
        const { message, signatures } = response.transaction;
        const meta = response.meta;
        if (!meta)
            throw new ValidateTransferError('missing meta');
        if (meta.err)
            throw meta.err;
        if (reference && !Array.isArray(reference)) {
            reference = [reference];
        }
        // Deserialize the transaction and make a copy of the instructions we're going to validate.
        const transaction = web3_js_1.Transaction.populate(message, signatures);
        const instructions = transaction.instructions.slice();
        // Transfer instruction must be the last instruction
        const instruction = instructions.pop();
        if (!instruction)
            throw new ValidateTransferError('missing transfer instruction');
        const [preAmount, postAmount] = splToken
            ? yield validateSPLTokenTransfer(instruction, message, meta, recipient, splToken, reference)
            : yield validateSystemTransfer(instruction, message, meta, recipient, reference);
        if (postAmount.minus(preAmount).lt(amount))
            throw new ValidateTransferError('amount not transferred');
        if (memo !== undefined) {
            // Memo instruction must be the second to last instruction
            const instruction = instructions.pop();
            if (!instruction)
                throw new ValidateTransferError('missing memo instruction');
            validateMemo(instruction, memo);
        }
        return response;
    });
}
exports.validateTransfer = validateTransfer;
function validateMemo(instruction, memo) {
    // Check that the instruction is a memo instruction with no keys and the expected memo data.
    if (!instruction.programId.equals(constants_js_1.MEMO_PROGRAM_ID))
        throw new ValidateTransferError('invalid memo program');
    if (instruction.keys.length)
        throw new ValidateTransferError('invalid memo keys');
    if (!instruction.data.equals(Buffer.from(memo, 'utf8')))
        throw new ValidateTransferError('invalid memo');
}
function validateSystemTransfer(instruction, message, meta, recipient, references) {
    return __awaiter(this, void 0, void 0, function* () {
        const accountIndex = message.accountKeys.findIndex((pubkey) => pubkey.equals(recipient));
        if (accountIndex === -1)
            throw new ValidateTransferError('recipient not found');
        if (references) {
            // Check that the instruction is a system transfer instruction.
            web3_js_1.SystemInstruction.decodeTransfer(instruction);
            // Check that the expected reference keys exactly match the extra keys provided to the instruction.
            const [_from, _to, ...extraKeys] = instruction.keys;
            const length = extraKeys.length;
            if (length !== references.length)
                throw new ValidateTransferError('invalid references');
            for (let i = 0; i < length; i++) {
                if (!extraKeys[i].pubkey.equals(references[i]))
                    throw new ValidateTransferError(`invalid reference ${i}`);
            }
        }
        return [
            new bignumber_js_1.default(meta.preBalances[accountIndex] || 0).div(web3_js_1.LAMPORTS_PER_SOL),
            new bignumber_js_1.default(meta.postBalances[accountIndex] || 0).div(web3_js_1.LAMPORTS_PER_SOL),
        ];
    });
}
function validateSPLTokenTransfer(instruction, message, meta, recipient, splToken, references) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        const recipientATA = yield (0, spl_token_1.getAssociatedTokenAddress)(splToken, recipient);
        const accountIndex = message.accountKeys.findIndex((pubkey) => pubkey.equals(recipientATA));
        if (accountIndex === -1)
            throw new ValidateTransferError('recipient not found');
        if (references) {
            // Check that the first instruction is an SPL token transfer instruction.
            const decodedInstruction = (0, spl_token_1.decodeInstruction)(instruction);
            if (!(0, spl_token_1.isTransferCheckedInstruction)(decodedInstruction) && !(0, spl_token_1.isTransferInstruction)(decodedInstruction))
                throw new ValidateTransferError('invalid transfer');
            // Check that the expected reference keys exactly match the extra keys provided to the instruction.
            const extraKeys = decodedInstruction.keys.multiSigners;
            const length = extraKeys.length;
            if (length !== references.length)
                throw new ValidateTransferError('invalid references');
            for (let i = 0; i < length; i++) {
                if (!extraKeys[i].pubkey.equals(references[i]))
                    throw new ValidateTransferError(`invalid reference ${i}`);
            }
        }
        const preBalance = (_a = meta.preTokenBalances) === null || _a === void 0 ? void 0 : _a.find((x) => x.accountIndex === accountIndex);
        const postBalance = (_b = meta.postTokenBalances) === null || _b === void 0 ? void 0 : _b.find((x) => x.accountIndex === accountIndex);
        return [
            new bignumber_js_1.default((preBalance === null || preBalance === void 0 ? void 0 : preBalance.uiTokenAmount.uiAmountString) || 0),
            new bignumber_js_1.default((postBalance === null || postBalance === void 0 ? void 0 : postBalance.uiTokenAmount.uiAmountString) || 0),
        ];
    });
}
//# sourceMappingURL=validateTransfer.js.map