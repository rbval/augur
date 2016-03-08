let React = require('react');

let Button = require("react-bootstrap/lib/Button");
let Input = require("react-bootstrap/lib/Input");

let MarketCreateStep3 = React.createClass({

    generateInputs(marketType) {
        switch (marketType) {
            case "binary":
            case "categorical":
                return (
                    <div>
                        <h3>
                            Set the starting price of each outcome
                        </h3>
                        <p>
                            These are your estimates of the percentage probability that each possible answer to your
                            question will be the correct outcome. The Market Maker will start selling the shares
                            purchased with your initial liquidity at these prices.
                        </p>
                        {
                            this.props.choices.map((outcome, index) => {
                              return (
                                  <Input
                                      type="text"
                                      label={outcome}
                                      key={index}
                                      data-index={index}
                                      value={this.props.outcomePrices[index]}
                                      help={this.props.outcomePriceErrors[index]}
                                      addonAfter='%'
                                      onChange={this.props.onOutcomePriceChange}
                                      />
                              );
                            })
                        }
                        { this.props.outcomePriceGlobalError != null &&
                            <p>
                                { this.props.outcomePriceGlobalError }
                            </p>
                        }
                    </div>
                );
            case "scalar": {
                let index = 0;
                return (
                    <div>
                        <h3>
                            Set the starting price for your question
                        </h3>
                        <p>
                            Enter what you believe is a fair and accurate estimate of the answer to your question. This
                            must lie between the minumum and maximum values set above. The Market Maker will start
                            selling the shares purchased with your initial liquidity at this prices.
                        </p>
                        <Input
                            type="text"
                            key={index}
                            data-index={index}
                            value={this.props.outcomePrices[index]}
                            help={this.props.outcomePriceErrors[index]}
                            onChange={this.props.onOutcomePriceChange}
                          />
                        <div>
                            Min: {this.props.minValue}, max: {this.props.maxValue}
                        </div>
                    </div>
                );
            }
            default:
                console.warn("MarketCreateStep3[generateInputs]: Unknown market type %o", marketType);
                return "";


        }

    },
    render() {
        let startingPriceSection = this.generateInputs(this.props.marketType);

        return (
            <div>
                <h1>
                    Trading fee and liquidity
                </h1>

                <form>
                    <div className="form-group">
                        <h3>
                            Set the trading fee for your market
                        </h3>
                        <p>
                            The Trading Fee is a percentage fee charged against the value of any trade made in the market.
                            You'll receive 50% of all fees charged during the lifetime of your market - with the other
                            50% being awarded to those reporting the outcome.
                        </p>
                        <Input
                            type='text'
                            help={ this.props.tradingFeeError }
                            addonAfter='%'
                            value={ this.props.tradingFee }
                            onChange={ this.props.onChangeTradingFee } />
                    </div>

                    <div className="form-group">
                        <h3>
                            Set the amount of initial liquidity
                        </h3>
                        <p>
                            Initial liquidity is the amount of cash you're putting into the market to get trading started.
                            The Market Maker will use these funds to buy shares - which are then sold back to those
                            wanting to trade your market when the market opens. Any initial liquidity remaining when
                            the market is expired will be returned to you (along with any profit generated by the Market
                            Maker from selling shares).
                        </p>
                        <Input
                            type="text"
                            help={ this.props.marketInvestmentError }
                            value={ this.props.marketInvestment }
                            onChange={ this.props.onChangeMarketInvestment } />
                    </div>

                    <div className="form-group">
                        {
                            startingPriceSection
                        }
                    </div>

                    <div className="form-group">
                        <button type="button" onClick={this.props.goToPreviousStep}>
                            back
                        </button>
                        <button type="button" onClick={this.props.goToNextStep}>
                            next
                        </button>
                    </div>
                </form>
            </div>
        )
    }
});

module.exports = MarketCreateStep3;