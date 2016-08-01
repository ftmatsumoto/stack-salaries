import React from 'react';
import { Link } from 'react-router';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { setSearchValue } from '../../actions/actionCreator';

class SearchInput extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {

    return (

      <form className="flexcontainer" onSubmit={this.props.getDatafromServer}>
        <div className="input-group">
          <span className="glyphicon glyphicon-search"></span>

          <input
            type="text"
            className="form-control"
            value={this.props.searchValue}
            onChange={this.props.findStack}
            placeholder="Add your tech stack separated by commas"
          />

          <input
            type="text"
            id="searchTextField"
            className="city form-control"
            value={this.props.cityState}
            onChange={this.props.findCityState}
            placeholder="New York, NY"
          />

          <button className="btn btn-primary">Search</button>
        </div>
      </form>

    );
  }
}

export default SearchInput;

function mapStateToProps(state) {
  return {
    searchValue: state.searchValue
  }
}


function mapDispatchToProps(dispatch) {
return bindActionCreators({setSearchValue}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(SearchInput);
