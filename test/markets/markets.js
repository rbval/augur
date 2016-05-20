/**
 * augur.js tests
 * @author Jack Peterson (jack@tinybike.net)
 */

"use strict";

var async = require("async");
var assert = require("chai").assert;
var abi = require("augur-abi");
var clone = require("clone");
var utils = require("../../src/utilities");
var contracts = require("augur-contracts");
var constants = require("../../src/constants");
var augurpath = "../../src/index";
var runner = require("../runner");
var tools = require("../tools");

describe("Unit tests", function () {
    describe("eth_call", function () {
        runner(this.title, [{
            method: "get_trade_ids",
            parameters: ["hash"]
        }, {
            method: "getVolume",
            parameters: ["hash"]
        }, {
            method: "getForkSelection",
            parameters: ["hash"]
        }, {
            method: "getMarketInfo",
            parameters: ["hash"]
        }, {
            method: "getMarketEvents",
            parameters: ["hash"]
        }, {
            method: "getNumEvents",
            parameters: ["hash"]
        }, {
            method: "getBranchID",
            parameters: ["hash"]
        }, {
            method: "getCurrentParticipantNumber",
            parameters: ["hash"]
        }, {
            method: "getMarketNumOutcomes",
            parameters: ["hash"]
        }, {
            method: "getCumScale",
            parameters: ["hash"]
        }, {
            method: "getTradingPeriod",
            parameters: ["hash"]
        }, {
            method: "getTradingFee",
            parameters: ["hash"]
        }, {
            method: "getWinningOutcomes",
            parameters: ["hash"]
        }, {
            method: "initialLiquidityAmount",
            parameters: ["hash", "int"]
        }, {
            method: "initialLiquidityAmount",
            parameters: ["hash", "intString"]
        }, {
            method: "initialLiquidityAmount",
            parameters: ["hash", "intHexString"]
        }, {
            method: "getSharesPurchased",
            parameters: ["hash", "int"]
        }, {
            method: "getSharesPurchased",
            parameters: ["hash", "intString"]
        }, {
            method: "getSharesPurchased",
            parameters: ["hash", "intHexString"]
        }, {
            method: "getParticipantSharesPurchased",
            parameters: ["hash", "int", "int"]
        }, {
            method: "getParticipantSharesPurchased",
            parameters: ["hash", "intString", "intString"]
        }, {
            method: "getParticipantSharesPurchased",
            parameters: ["hash", "intHexString", "intHexString"]
        }, {
            method: "getParticipantID",
            parameters: ["hash", "int"]
        }, {
            method: "getParticipantID",
            parameters: ["hash", "intString"]
        }, {
            method: "getParticipantID",
            parameters: ["hash", "intHexString"]
        }]);
    });
    describe("eth_sendTransaction", function () {
        runner(this.title, [{
            method: "initialLiquiditySetup",
            parameters: ["hash", "fixed", "fixed", "int"]
        }, {
            method: "initializeMarket",
            parameters: ["hash", "hashArray", "int", "fixed", "hash"]
        }, {
            method: "modifyShares",
            parameters: ["hash", "int", "fixed"]
        }]);
    });
});

describe("Integration tests", function () {

    var augur = tools.setup(tools.reset(augurpath), process.argv.slice(2));
    var amount = "1";
    var branchId = augur.branches.dev;
    var accounts = tools.get_test_accounts(augur, tools.MAX_TEST_ACCOUNTS);
    var traderIndex = "1";
    var outcome = 1;
    var markets = augur.getMarketsInBranch(branchId);
    var numMarkets = markets.length;
    var marketId = tools.select_random(markets);
    if (numMarkets > tools.MAX_TEST_SAMPLES) {
        var randomMarkets = [];
        numMarkets = tools.MAX_TEST_SAMPLES;
        do {
            if (randomMarkets.indexOf(marketId) === -1) {
                randomMarkets.push(marketId);
            }
            marketId = tools.select_random(markets);
        } while (randomMarkets.length < tools.MAX_TEST_SAMPLES);
        markets = randomMarkets;
    }
    tools.TIMEOUT *= 2;

    var errorCheck = function (output, done) {
        done = done || utils.pass;
        if (output && output.constructor === Object && output.error) {
            return done(new Error(JSON.stringify(output)));
        }
        return {output: output, done: done};
    };

    var runtests = function (method, test) {
        var arglen = arguments.length;
        var params = new Array(arglen - 2);
        if (params.length) {
            for (var i = 2; i < arglen; ++i) {
                params[i - 2] = arguments[i];
            }
        }
        describe(params.toString(), function () {
            it("async", function (done) {
                this.timeout(tools.TIMEOUT);
                augur[method].apply(augur, params.concat(function (output) {
                    test(errorCheck(output, done));
                }));
            });
            it("sync", function (done) {
                this.timeout(tools.TIMEOUT);
                var output = augur[method].apply(augur, params);
                test(errorCheck(output, done));
            });
            if (augur.tx[method]) {
                it("batch", function (done) {
                    this.timeout(tools.TIMEOUT);
                    var batch = augur.createBatch();
                    batch.add(method, params, function (output) {
                        test(errorCheck(output));
                    });
                    batch.add(method, params, function (output) {
                        test(errorCheck(output, done));
                    });
                    batch.execute();
                });
            }
        });
    };

    var testMarketInfo = function (info) {
        var r;
        assert(info.constructor === Array || info.constructor === Object);
        if (info.constructor === Array) {
            assert.isAbove(info.length, 43);
            info = augur.rpc.encodeResult(info);
            assert.strictEqual(info[7], branchId);
            r = augur.parseMarketInfo(info);
            r._id = abi.hex(info[0]);
            if (r.numEvents > 1) {
                var txList = new Array(r.numEvents);
                for (var i = 0; i < r.numEvents; ++i) {
                    txList[i] = tools.copy(augur.tx.getDescription);
                    txList[i].params = r.events[i].id;
                }
                var response = augur.rpc.batch(txList);
                for (i = 0; i < response.length; ++i) {
                    r.events[i].description = response[i];
                }
            }
        } else {
            r = info;
        }
        var market = r._id;
        assert.isObject(r);
        assert.property(r, "_id");
        assert.property(r, "network");
        assert(r.network === "7" || r.network === "10101" || r.network === "2");
        assert.property(r, "traderCount");
        assert.isAbove(r.traderIndex, -1);
        assert.strictEqual(parseInt(augur.getCurrentParticipantNumber(market)), r.traderCount);
        assert.property(r, "makerFees");
        assert.isNotNull(r.makerFees);
        assert.property(r, "tags");
        assert.isNotNull(r.tags);
        assert.property(r, "traderIndex");
        assert.isAbove(r.traderIndex, -1);
        assert.property(r, "numOutcomes");
        assert.isAbove(r.numOutcomes, 1);
        assert.strictEqual(parseInt(augur.getMarketNumOutcomes(market)), r.numOutcomes);
        assert.property(r, "tradingPeriod");
        assert.isNumber(r.tradingPeriod);
        assert.strictEqual(parseInt(augur.getTradingPeriod(market)), r.tradingPeriod);
        assert.property(r, "tradingFee");
        assert(abi.number(r.tradingFee) >= 0);
        assert(abi.number(r.tradingFee) <= 1);
        assert.strictEqual(augur.getTradingFee(market), r.tradingFee);
        assert.property(r, "branchId");
        assert.strictEqual(augur.getBranchID(market), r.branchId);
        assert.property(r, "numEvents");
        assert.strictEqual(parseInt(augur.getNumEvents(market)), r.numEvents);
        assert.property(r, "cumulativeScale");
        assert.property(r, "creationFee");
        assert.strictEqual(augur.getCreationFee(market), r.creationFee);
        assert.property(r, "author");
        assert.strictEqual(augur.getCreator(market), r.author);
        assert.property(r, "endDate");
        assert.property(r, "participants");
        assert.isObject(r.participants);
        assert.property(r, "outcomes");
        assert.isArray(r.outcomes);
        assert.isAbove(r.outcomes.length, 1);
        for (var i = 0, len = r.outcomes.length; i < len; ++i) {
            assert.property(r.outcomes[i], "id");
            assert.isNumber(r.outcomes[i].id);
            assert.property(r.outcomes[i], "outstandingShares");
            assert(abi.number(r.outcomes[i].outstandingShares) >= 0);
            assert.property(r.outcomes[i], "shares");
            assert.isObject(r.outcomes[i].shares);
        }
        assert.property(r, "events");
        assert.isArray(r.events);
        assert.isAbove(r.events.length, 0);
        var marketEvents = augur.getMarketEvents(market);
        assert.strictEqual(marketEvents.length, r.events.length);
        for (var i = 0, len = r.events.length; i < len; ++i) {
            assert.isObject(r.events[i]);
            assert.property(r.events[i], "id");
            assert.strictEqual(marketEvents[i], r.events[i].id);
            assert.property(r.events[i], "endDate");
            assert.isAbove(r.events[i].endDate, 0);
            assert.property(r.events[i], "outcome");
            assert.isNotNull(r.events[i].outcome);
            assert.property(r.events[i], "minValue");
            assert.isNotNull(r.events[i].minValue);
            assert.property(r.events[i], "maxValue");
            assert.isNotNull(r.events[i].maxValue);
            assert.property(r.events[i], "numOutcomes");
            assert.isAbove(parseInt(r.events[i].numOutcomes), 1);
        }
    };

    before(function () {
        augur = tools.setup(tools.reset(augurpath), process.argv.slice(2));
    });
    describe("getMarketInfo", function () {
        var test = function (t) {
            testMarketInfo(t.output);
            t.done();
        };
        for (var i = 0; i < numMarkets; ++i) {
            runtests(this.title, test, markets[i]);
        }
    });
    describe("getOrderBook", function () {
        var test = function (t) {
            assert.isObject(t.output);
        };
        for (var i = 0; i < numMarkets; ++i) {
            runtests(this.title, test, markets[i]);
        }
    });
    describe("getMarketEvents", function () {
        var test = function (t) {
            assert.isArray(t.output);
            assert.isAbove(t.output.length, 0);
            assert.isBelow(t.output.length, 4);
            async.each(t.output, function (event, nextEvent) {
                augur.getDescription(event, function (desc) {
                    if (desc.error) return nextEvent(desc);
                    assert.isString(desc);
                    assert.isAbove(desc.length, 0);
                    nextEvent();
                });
            }, t.done);
        };
        for (var i = 0; i < numMarkets; ++i) {
            runtests(this.title, test, markets[i]);
        }
    });
    describe("getNumEvents", function () {
        var test = function (t) {
            var output = parseInt(t.output);
            assert.isNumber(output);
            assert.isAbove(output, 0);
            assert.isBelow(output, 4);
            t.done();
        };
        for (var i = 0; i < numMarkets; ++i) {
            runtests(this.title, test, markets[i]);
        }
    });
    describe("getBranchID", function () {
        var test = function (t) {
            assert.strictEqual(abi.hex(t.output), abi.hex(augur.branches.dev));
            t.done();
        };
        for (var i = 0; i < numMarkets; ++i) {
            runtests(this.title, test, markets[i]);
        }
    });
    describe("getCurrentParticipantNumber", function () {
        var test = function (t) {
            tools.gteq0(t.output);
            t.done();
        };
        for (var i = 0; i < numMarkets; ++i) {
            runtests(this.title, test, markets[i]);
        }
    });
    describe("getMarketNumOutcomes", function () {
        var test = function (t) {
            assert.isAbove(parseInt(t.output), 1);
            t.done();
        };
        for (var i = 0; i < numMarkets; ++i) {
            runtests(this.title, test, markets[i]);
        }
    });
    describe("getParticipantSharesPurchased", function () {
        var test = function (t) {
            tools.gteq0(t.output);
            t.done();
        };
        for (var i = 0; i < numMarkets; ++i) {
            runtests(this.title, test, markets[i], traderIndex, outcome);
        }
    });
    describe("getSharesPurchased", function () {
        var test = function (t) {
            tools.gteq0(t.output);
            t.done();
        };
        for (var i = 0; i < numMarkets; ++i) {
            runtests(this.title, test, markets[i], outcome);
        }
    });
    describe("getWinningOutcomes", function () {
        var test = function (t) {
            assert.isArray(t.output);
            t.done();
        };
        for (var i = 0; i < numMarkets; ++i) {
            runtests(this.title, test, markets[i]);
        }
    });
    describe("getParticipantNumber", function () {
        var test = function (t) {
            tools.gteq0(t.output);
            t.done();
        };
        for (var i = 0; i < numMarkets; ++i) {
            runtests(this.title, test, markets[i], accounts[0]);
        }
    });
    describe("getParticipantID", function () {
        var test = function (t) {
            tools.gteq0(t.output);
            t.done();
        };
        for (var i = 0; i < numMarkets; ++i) {
            runtests(this.title, test, markets[i], traderIndex);
        }
    });
    describe("getCumScale", function () {
        var test = function (t) {
            assert.isAbove(abi.number(t.output), 0);
            t.done();
        };
        for (var i = 0; i < numMarkets; ++i) {
            runtests(this.title, test, markets[i]);
        }
    });
    describe("getTradingPeriod", function () {
        var test = function (t) {
            assert.isAbove(abi.number(t.output), -2);
            t.done();
        };
        for (var i = 0; i < numMarkets; ++i) {
            runtests(this.title, test, markets[i]);
        }
    });
    describe("getTradingFee", function () {
        var test = function (t) {
            var output = t.output;
            assert.isAbove(abi.number(output), 0);
            t.done();
        };
        for (var i = 0; i < numMarkets; ++i) {
            runtests(this.title, test, markets[i]);
        }
    });
    describe("getMarketsInfo", function () {
        var test = function (info, options, done) {
            if (utils.is_function(options) && !done) {
                done = options;
                options = undefined;
            }
            options = options || {};
            assert.isObject(info);
            var numMarkets = options.numMarkets || parseInt(augur.getNumMarkets(branchId));
            var market;
            assert.strictEqual(Object.keys(info).length, numMarkets);
            for (var marketId in info) {
                if (!info.hasOwnProperty(marketId)) continue;
                market = info[marketId];
                assert.isArray(market.events);
                assert.isAbove(market.events.length, 0);
                assert.isString(market.type);
                assert(market.type === "binary" ||
                       market.type === "categorical" ||
                       market.type === "scalar" ||
                       market.type === "combinatorial");
                if (market.type === "combinatorial") {
                    for (var i = 0; i < market.numEvents; ++i) {
                        assert.isNumber(market.events[i].endDate);
                        assert.isString(market.events[i].id);
                        if (options.combinatorial) {
                            assert.isString(market.events[i].description);
                        }
                    }
                }
            }
            if (done) done();
        };
        var params = {
            branch: branchId,
            offset: 0,
            numMarketsToLoad: 3
        };
        it("sync", function () {
            this.timeout(tools.TIMEOUT);
            test(augur.getMarketsInfo(params), {numMarkets: params.numMarketsToLoad});
        });
        it("sync/missing numMarketsToLoad", function () {
            this.timeout(tools.TIMEOUT);
            var p = tools.copy(params);
            delete p.numMarketsToLoad;
            test(augur.getMarketsInfo(p));
        });
        it("sync/missing numMarketsToLoad/missing offset", function () {
            this.timeout(tools.TIMEOUT);
            var p = tools.copy(params);
            delete p.numMarketsToLoad;
            delete p.offset;
            test(augur.getMarketsInfo(p));
        });
        it("sync/combinatorial", function () {
            this.timeout(tools.TIMEOUT);
            var p = tools.copy(params);
            p.combinatorial = true;
            test(augur.getMarketsInfo(p), {
                numMarkets: params.numMarketsToLoad,
                combinatorial: true
            });
        });
        it("async", function (done) {
            this.timeout(tools.TIMEOUT);
            params.callback = function (info) {
                if (info.error) return done(info);
                test(info, {numMarkets: params.numMarketsToLoad}, done);
            };
            augur.getMarketsInfo(params);
        });
        it("async/missing numMarketsToLoad", function (done) {
            this.timeout(tools.TIMEOUT);
            var p = tools.copy(params);
            delete p.numMarketsToLoad;
            p.callback = function (info) {
                if (info.error) return done(info);
                test(info, done);
            };
            augur.getMarketsInfo(p);
        });
        it("async/missing numMarketsToLoad/missing offset", function (done) {
            this.timeout(tools.TIMEOUT);
            var p = tools.copy(params);
            delete p.numMarketsToLoad;
            delete p.offset;
            p.callback = function (info) {
                if (info.error) return done(info);
                test(info, done);
            };
            augur.getMarketsInfo(p);
        });
        it("async/offset=1/numMarketsToLoad=2", function (done) {
            this.timeout(tools.TIMEOUT);
            var numMarketsToLoad = 3;
            augur.getMarketsInfo({
                branch: branchId,
                offset: 1,
                numMarketsToLoad: numMarketsToLoad,
                callback: function (info) {
                    if (info.error) return done(info);
                    assert.strictEqual(Object.keys(info).length, numMarketsToLoad);
                    test(info, {numMarkets: numMarketsToLoad}, done);
                }
            });
        });
        it("async/combinatorial", function (done) {
            this.timeout(tools.TIMEOUT);
            var p = tools.copy(params);
            p.combinatorial = true;
            p.callback = function (info) {
                if (info.error) return done(info);
                test(info, {
                    numMarkets: params.numMarketsToLoad,
                    combinatorial: true
                }, done);
            };
            augur.getMarketsInfo(p);
        });
    });
});
