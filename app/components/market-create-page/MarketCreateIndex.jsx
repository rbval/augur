let React = require('react');

let MarketCreateIndex = React.createClass({
    render() {
        return (
            <div>
                <h1>
                    Select the type of market you want to create
                </h1>

                <div className="">
                    <a href="#" data-type="binary" onClick={this.props.onMarketTypeChange}>
                        <h4>
                            A market with
                            a <span className="text-uppercase">yes</span> or <span className="text-uppercase">no</span> outcome
                        </h4>
                        <span>
                            Select
                        </span>
                    </a>

                    <p>
                        Ask a question that has a
                        simple <span className="text-uppercase">yes</span> or <span className="text-uppercase">no</span> answer
                    </p>
                </div>
                <div className="">
                    <a href="#" data-type="categorical" onClick={this.props.onMarketTypeChange}>
                        <h4>
                            A market with a <span className="text-uppercase">multiple choice</span> outcome
                        </h4>
                        <span>
                            Select
                        </span>
                    </a>

                    <p>
                        Ask a question and provide a series of multiple choice answers
                    </p>
                </div>
                <div className="">
                    <a href="#" data-type="scalar" onClick={this.props.onMarketTypeChange}>
                        <h4>
                            A market with a <span className="text-uppercase">numeric</span> outcome
                        </h4>
                        <span>
                            Select
                        </span>
                    </a>

                    <p>
                        Ask a question that has an answer somewhere within a range of numbers
                    </p>
                </div>
                <div>
                    <h4>
                        Important:
                    </h4>

                    <p>
                        There is a $30.00 bond charged to your account when you create a new market. If the
                        outcome
                        of your market cannot be determined (and the market cannot be expired as a result) or if
                        your market is ruled unethical, this bond will be forfeited. If your market is expired
                        the
                        bond will be returned to you in full.
                    </p>
                </div>
            </div>
        );
    }
});

module.exports = MarketCreateIndex;