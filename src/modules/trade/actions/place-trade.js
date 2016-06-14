import * as AugurJS from '../../../services/augurjs';

import { BRANCH_ID } from '../../app/constants/network';
import {
	PLACE_MULTI_TRADE,
	SUCCESS,
	FAILED
} from '../../transactions/constants/statuses';
import { addTransaction } from '../../transactions/actions/add-transactions';
import { makeMultiTradeTransaction } from '../../transactions/actions/add-trade-transaction';
import { updateExistingTransaction } from '../../transactions/actions/update-existing-transaction';
import { clearTradeInProgress } from '../../trade/actions/update-trades-in-progress';
import { loadAccountTrades } from '../../positions/actions/load-account-trades';
import { selectMarket } from '../../market/selectors/market';
import { selectTransactionsLink } from '../../link/selectors/links';

export function placeTrade(marketID) {
	return (dispatch, getState) => {
		const market = selectMarket(marketID);

		dispatch(addTransaction(makeMultiTradeTransaction(marketID, dispatch)));

		dispatch(clearTradeInProgress(marketID));

		selectTransactionsLink(dispatch).onClick();
	};
}

/**
 * 
 * @param {Number} transactionID
 * @param {String} marketID
 */
export function multiTrade(transactionID, marketID) {
	return (dispatch, getState) => {
		const market = selectMarket(marketID);

		const marketOrderBook = getState().marketOrderBooks[marketID];

		const tradeOrders = market.tradeSummary.tradeOrders;

		const positionPerOutcome = market.positionOutcomes.reduce((outcomePositions, outcome) => {
			outcomePositions[outcome.id] = outcome.position;
			return outcomePositions;
		}, {});

		dispatch(updateExistingTransaction(transactionID, { status: PLACE_MULTI_TRADE }));

		AugurJS.multiTrade(
			transactionID, marketID, marketOrderBook, tradeOrders, positionPerOutcome,
			function onTradeHash(transactionID, res) {
				console.log("onTradeHash %o", res);
				let newTransactionData;
				if (res.error != null) {
					newTransactionData = {
						status: FAILED,
						message: res.message
					};
				} else {
					newTransactionData = {
						message: "received trade hash"
					}
				}
				dispatch(updateExistingTransaction(transactionID, newTransactionData));
			},
			function onCommitSent(transactionID, res) {
				console.log("onCommitSent %o", res);

				dispatch(updateExistingTransaction(transactionID, { status: "commit sent" }));
			},
			function onCommitSuccess(transactionID, res) {
				console.log("onCommitSuccess %o", res);
				dispatch(updateExistingTransaction(transactionID, { status: "CommitSuccess" }));
			},
			function onCommitFailed(transactionID, res) {
				console.log("onCommitFailed %o", res.bubble.stack);
				dispatch(updateExistingTransaction(transactionID, { status: FAILED }));
			},
			function onNextBlock(transactionID, res) {
				console.log("onNextBlock %o", res);
				// dispatch(updateExistingTransaction(transactionID, { status: res.status });)
			},
			function onTradeSent(transactionID, res) {
				console.log("onTradeSent %o", res);
				dispatch(updateExistingTransaction(transactionID, { status: "TradeSent" }));
			},
			function onTradeSuccess(transactionID, res) {
				console.log("onTradeSuccess %o", res);
				dispatch(updateExistingTransaction(transactionID, { status: SUCCESS }));
			},
			function onTradeFailed(transactionID, res) {
				console.log("onTradeFailed %o", res.bubble.stack);
				dispatch(updateExistingTransaction(transactionID, { status: FAILED }));
			},
			function onBuySellSent(transactionID, res) {
				console.log("onBuySellSent %o", res);
				dispatch(updateExistingTransaction(transactionID, { status: "BuySellSent" }));
			},
			function onBuySellSuccess(transactionID, res) {
				console.log("onBuySellSuccess %o", res);
				dispatch(updateExistingTransaction(transactionID, { status: SUCCESS }));
			},
			function onBuySellFailed(transactionID, res) {
				console.log("onBuySellFailed %o", res.bubble.stack);
				dispatch(updateExistingTransaction(transactionID, { status: FAILED }));
			},
			function onShortSellSent(transactionID, res) {
				console.log("onShortSellSent %o", res);
				dispatch(updateExistingTransaction(transactionID, { status: "ShortSellSent" }));
			},
			function onShortSellSuccess(transactionID, res) {
				console.log("onShortSellSuccess %o", res);
				dispatch(updateExistingTransaction(transactionID, { status: SUCCESS }));
			},
			function onShortSellFailed(transactionID, res) {
				console.log("onShortSellFailed %o", res.bubble.stack);
				dispatch(updateExistingTransaction(transactionID, { status: FAILED }));
			},
			function onBuyCompleteSetsSent(transactionID, res) {
				console.log("onBuyCompleteSetsSent %o", res);
				dispatch(updateExistingTransaction(transactionID, { status: "BuyCompleteSetsSent" }));
			},
			function onBuyCompleteSetsSuccess(transactionID, res) {
				console.log("onBuyCompleteSetsSuccess %o", res);
				dispatch(updateExistingTransaction(transactionID, { status: SUCCESS }));
			},
			function onBuyCompleteSetsFailed(transactionID, res) {
				console.log("onBuyCompleteSetsFailed %o", res.bubble.stack);
				dispatch(updateExistingTransaction(transactionID, { status: FAILED }));
			}
		);
	};
}
