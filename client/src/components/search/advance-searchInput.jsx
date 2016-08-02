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
            name="state"
            maxlength="2"
            placeholder="Add your desired state"
          />
        </div>
      </fieldset>

      <fieldset className="form-group row gray">
        <div className="col-sm-1">
          <span className="glyphicon glyphicon-globe"></span>
        </div>
        <div className="col-sm-11">
          <select
          className="center-block form-control fit"
          value={props.state}
          onChange={props.findState}
          >
            <option disabled selected>Add your desired state</option>
            <option value='High School'>High School</option>
            <option value='Some College'>Some College</option>
            <option value='AA'>AA</option>
            <option value='BA'>BA</option>
            <option value='BS'>BS</option>
            <option value='MA'>MA</option>
            <option value='MS'>MS</option>
            <option value='PhD'>PhD</option>
          </select>
        </div>
      </fieldset>



      <fieldset className="form-group row gray">
        <div className="col-sm-1">
          <span className="glyphicon glyphicon-education"></span>
        </div>
        <div className="col-sm-11">
          <select
          className="center-block form-control fit"
          value={props.education}
          onChange={props.findEducation}
          >
            <option disabled selected>Add your education</option>
            <option value='High School'>High School</option>
            <option value='Some College'>Some College</option>
            <option value='AA'>AA</option>
            <option value='BA'>BA</option>
            <option value='BS'>BS</option>
            <option value='MA'>MA</option>
            <option value='MS'>MS</option>
            <option value='PhD'>PhD</option>
          </select>
        </div>
      </fieldset>

      <fieldset className="form-group row gray">
        <div className="col-sm-1">
          <span className="glyphicon glyphicon-user"></span>
        </div>
        <div className="col-sm-11">
          <select
          className="center-block form-control fit"
          value={props.gender}
          onChange={props.addGender}
          >
            <option disabled selected>Add your gender</option>
            <option value='Male'>Male</option>
            <option value='Female'>Female</option>
            <option value='Other'>Other</option>
          </select>
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