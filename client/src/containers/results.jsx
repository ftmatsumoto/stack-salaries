// Import all required modules
import React from 'react';
import d3 from 'd3';
import { History, Router } from 'react-router';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

// Import all actions & helper methods
import { setSearch } from '../actions/actionCreator';

// Import all containers
import search from '../containers/search';


var SetIntervalMixin = {
  componentWillMount: function() {
    this.intervals = [];
  },
  setInterval: function() {
    this.intervals.push(setInterval.apply(null, arguments));
  },
  componentWillUnmount: function() {
    this.intervals.map(clearInterval);
  }
};


var Rect = React.createClass({
    mixins: [SetIntervalMixin],
    getDefaultProps: function() {
        return {
            width: 0,
            height: 0,
            x: 0,
            y: 0
        }
    },

    getInitialState: function() {
      return {
        milliseconds: 0,
        height: 0
      };
    },

    shouldComponentUpdate: function(nextProps) {
      return this.props.height !== this.state.height;
    },

    componentWillReceiveProps: function(nextProps) {
      this.setState({milliseconds: 0, height: this.props.height});
    },

    componentDidMount: function() {
      this.setInterval(this.tick, 10);
    },

    tick: function(start) {
      this.setState({milliseconds: this.state.milliseconds + 10});
    },

    render: function() {
      var easyeasy = d3.ease('back-out');
      var height = this.state.height + (this.props.height - this.state.height) * easyeasy(Math.min(1, this.state.milliseconds/1000));
      var y = this.props.height - height + this.props.y;
        return (
          <rect className="bar"
                height={height}
                y={y}
                width={this.props.width}
                x={this.props.x}
          >
          </rect>
        );
    },
});

var salaryRange = ['Lowest', 'Average', 'Highest'];

var Bar = React.createClass({
  getDefaultProps: function() {
    return {
      data: []
    }
  },

  shouldComponentUpdate: function(nextProps) {
      return this.props.data !== nextProps.data;
  },

  render: function() {
    var props = this.props;
    var data = props.data.map(function(d) {
      return d.y;
    });

    var yScale = d3.scale.linear()
      .domain([0, 200000])
      .range([0, this.props.height]);

    var xScale = d3.scale.ordinal()
      .domain(d3.range(this.props.data.length))
      .rangeRoundBands([0, this.props.width], 0.05);

    var bars = data.map(function(point, i) {
      var height = yScale(point),
          y = props.height - height,
          width = xScale.rangeBand(),
          x = xScale(i);

      return (
        <g key={i} id={'bar' + i}>
        <Rect height={height}
              width={width}
              x={x}
              y={y+ 50}
              />
        <text y={y + 37} x={x + 77}
        textAnchor='middle'
        fontFamily='Helvetica Neue'
        fontSize="20"
        >{'$' + point}</text>
        <text y={580} x={x + 77}
        textAnchor='middle'
        fontFamily='Helvetica Neue'
        fontSize="20"
        >{salaryRange[i]}</text>
        </g>
      )
    });

    return (
          <g>{bars}</g>
    );
  }
});

var Chart = React.createClass({
    render: function() {
        return (
            <svg width={this.props.width}
                 height={this.props.height + 95} >
              {this.props.children}
            </svg>
        );
    }
});

var Axis = React.createClass({
  render: function() {
    return <g></g>
  }
});

var changeDataTrue = true;

class Results extends React.Component {
    constructor(props){
      super(props);
      this.state = {
        width: 500,
        height: 500,
      }
    }

    render() {

        return (
          <div>
            <div className="selection">
              <h3 className="text-center">{this.props.salary.label}</h3>
            </div>
            <Chart width={this.state.width}
                   height={this.state.height}>
              <Bar data={[
                  {x: 'a', y: this.props.salary.lowest},
                  {x: 'b', y: this.props.salary.average},
                  {x: 'c', y: this.props.salary.highest}
                ]}
                    width={this.state.width}
                    height={this.state.height} />
            </Chart>
          </div>
        );
    }
};

 function mapStateToProps(state) {
    return {
      salary: state.salary
    }
  }

function mapDispatchToProps(dispatch) {
  return bindActionCreators({setSearch: setSearch}, dispatch);
}


export default connect(mapStateToProps, mapDispatchToProps)(Results);