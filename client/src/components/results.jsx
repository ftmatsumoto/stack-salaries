import React from 'react';
import d3 from 'd3';



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
      .domain([0, d3.max(data)])
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
        <Rect height={height}
              width={width}
              x={x}
              y={y}
              key={i} />
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
                 height={this.props.height} >
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

var all = [
  {x: 'a', y: 65000},
  {x: 'b', y: 106000},
  {x: 'c', y: 180000}
];


var Results = React.createClass({
    getDefaultProps: function() {
        return {
          width: 500,
          height: 500
        }
    },

    getInitialState: function() {
        return {
          data: all
        }
    },

    showAll: function() {
      this.setState({data : all})
    },

    render: function() {
        return (
          <div>
            <div className="selection">
              <h3>Salary stats for React in Blahstown, BH</h3>
            </div>
            <hr/>
            <Chart width={this.props.width}
                   height={this.props.height}>
              <Bar data={this.state.data}
                          width={this.props.width}
                          height={this.props.height} />
            </Chart>
          </div>
        );
    }
});

export default Results;

// import React from 'react';
// import ReactD3 from 'react-d3-components';

// var SalaryChart = ReactD3.BarChart;

// var data = [{
//     values: [{x: 'Lowest', y: 65}, {x: 'Average', y: 106}, {x: 'Highest', y: 185}]
// }];

// const Results = React.createClass({
//   render: function() {
//     return (
//       <div>
//         <SalaryChart
//         data={data}
//         width={600}
//         height={400}
//         margin={{top: 10, bottom: 50, left: 50, right: 10}}/>
//       </div>
//     );
//   }
// });

// export default Results;