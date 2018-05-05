import React, { Component } from 'react';
import Highcharts from 'highcharts/highstock';

class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            query: '',
            quotes: [],
            seriesOptions: [],
            seriesCounter: 0,
            chartRendered: false,
            show: false
        };
        this.handleInputChange = this.handleInputChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.removeQuote = this.removeQuote.bind(this);
        this.createChart = this.createChart.bind(this);
        this.getChartData = this.getChartData.bind(this);
    }
    componentWillMount(){
        fetch('/quotes')
            .then(res => res.json())
            .then(res => {
                this.setState({ quotes: res.data }, () => {
                                        this.createChart();
                });
            });
    }
    componentDidMount() {

    
                    // this.createChart();

        
    }
    createChart() {
        Highcharts.stockChart('chart', {
            rangeSelector: {
                selected: 4
            },
            yAxis: {
                labels: {
                    formatter: function() {
                        return (this.value > 0 ? ' + ' : '') + this.value + '%';
                    }
                },
                plotLines: [{
                    value: 0,
                    width: 2,
                    color: 'silver'
                }]
            },
            plotOptions: {
                series: {
                    compare: 'percent',
                    showInNavigator: true
                }
            },
            tooltip: {
                pointFormat: '<span style="color:{series.color}">{series.name}</span>: <b>{point.y}</b> ({point.change}%)<br/>',
                valueDecimals: 2,
                split: true
            },
            series: this.state.seriesOptions
        });
        if (this.state.chartRendered === false) {
            this.getChartData();
            this.setState({ chartRendered: true });
        }
    }
    getChartData() {
        this.setState({ seriesCounter: 0 });
        this.setState({seriesOptions: []})
        console.log('Getting data for', this.state.quotes);
        this.state.quotes.forEach((quote, i) => {
            fetch(`https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${quote.symbol.toLowerCase()}&apikey=WR97XAULEDHCHNDB`)
                .then(res => res.json())
                .then(data => {
                    const dates = Object.keys(data['Time Series (Daily)']);
                    const prices = Object.values(data['Time Series (Daily)']).map(date => +date['4. close']);
                    const series = dates.map(
                        (d, i) => [new Date(d).getTime(), prices[i]])
                    const seriesOption = {
                        name: quote.symbol,
                        data: series
                    };
                    this.setState({
                        seriesOptions: this.state.seriesOptions.concat(seriesOption)
                    })
                    // As we're loading the data asynchronously, we don't know what order it will arrive. So we keep a counter and create the chart when all the data is loaded.
                    this.setState({ seriesCounter: this.state.seriesCounter + 1 })
                    if (this.state.seriesCounter === this.state.quotes.length) {
                        this.createChart();
                    }
                })
        })
    }
    handleInputChange(event) {
        this.setState({ query: event.target.value })
    }
    handleSubmit(event) {
        event.preventDefault();
        console.log('Get ' + this.state.query)
        this.state.quotes.forEach(quote=>{
            if(quote.symbol===this.state.query){
                return;
            } else {
                
        this.setState({ quotes: this.state.quotes.concat({symbol: this.state.query}) }, function() {
            this.createChart();
        })
            }
        })
    }
    removeQuote(name) {
        fetch('/quotes/'+name,{
            method: 'DELETE'
        })
        this.setState({
            quotes: this.state.quotes.filter(quote => quote.symbol !== name)
        }, ()=>{
            this.getChartData();
        });
    }
    render() {
        return (
            <div className="app">
            <h3 className="app__title">Chart Sync</h3>
            <section>
                <div id="chart" style={{    
                    height: '400px',
                    minWidth:'310px'
                }}></div>
            </section>
            <section>
                <div className="quotes-container">
                    <ul className="quotes">
                        {this.state.quotes.map((quote, i)=>{
                            return (
                                <li className="quote" key={i}>
                                    <span className="quote__name">{quote.symbol}</span>
                                    <span className="quote__delete" onClick={()=>this.removeQuote(quote.symbol)}>&#10005;</span>
                                </li>
                            );
                        })}
                    </ul>
                </div>
                <div className="search-container">
                    <form onSubmit={this.handleSubmit}>
                        <input type="text" className="input__field" id="quote" value={this.state.query} onChange={this.handleInputChange} placeholder="Quote"/>
                    </form>
               </div>
           </section>
       </div>);
    }
}

export default App;