import React from 'react';
import { Link } from 'react-router';

var AdvancedSearchInput = (props) => (

  <div className="dashboard center-block text-center">
    <form onSubmit={props.GetAdvancedSearchData} >

      <fieldset className="form-group row gray">
        <div className="col-sm-1">
          <span className="glyphicon glyphicon-globe"></span>
        </div>
        <div className="col-sm-11">
          <input
            type="text"
            value={props.city}
            className="form-control"
            onChange={props.findCity}
            placeholder="Add your desired city"
          />
        </div>
      </fieldset>


      <fieldset className="form-group row gray">
        <div className="col-sm-1">
          <span className="glyphicon glyphicon-globe"></span>
        </div>
        <div className="col-sm-11">
          <input
            type="text"
            value={props.state}
            className="form-control"
            onChange={props.findState}
            placeholder="Add your desired state"
          />
        </div>
      </fieldset>

      <fieldset className="form-group row gray">
        <div className="col-sm-1">
          <span className="glyphicon glyphicon-education"></span>
        </div>
        <div className="col-sm-11">
          <input
            type="text"
            value={props.education}
            className="form-control"
            onChange={props.findEducation}
            placeholder="Education Level"
          />
        </div>
      </fieldset>

      <fieldset className="form-group row gray">
        <div className="col-sm-1">
          <span className="glyphicon glyphicon-user"></span>
        </div>
        <div className="col-sm-11">
          <input
            type="text"
            value={props.gender}
            className="form-control"
            onChange={props.findGender}
            placeholder="Gender"
          />
        </div>
      </fieldset>

      <fieldset className="form-group row gray">
        <div className="col-sm-1">
            <span className="glyphicon glyphicon-briefcase"></span>
        </div>
        <div className="col-sm-11">
          <input
            type="text"
            value={props.experience}
            className="form-control"
            onChange={props.findExperience}
            placeholder="Years of experience"
          />
        </div>
      </fieldset>

     <fieldset className="form-group row gray">
        <div className="col-sm-1">
            <span className="glyphicon glyphicon-equalizer"></span>
        </div>
        <div className="col-sm-11">
          <input
            type="text"
            value={props.stack}
            className="form-control"
            onChange={props.findStack}
            placeholder="Add any stack skills separated by commas" />
        </div>
      </fieldset>

      <div className="row">
        <button type="submit" className="btn btn-primary">Submit</button>
      </div>
    </form>
  </div>
);

export default AdvancedSearchInput;