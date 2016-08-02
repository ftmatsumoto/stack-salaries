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
          <select
          className="center-block form-control fit"
          value={props.state}
          onChange={props.findState}
          >
            <option disabled selected>Add your desired state</option>
            <option value='AL'>AL</option>
            <option value='AK'>AK</option>
            <option value='AZ'>AZ</option>
            <option value='AR'>AR</option>
            <option value='CA'>CA</option>
            <option value='CO'>CO</option>
            <option value='CT'>CT</option>
            <option value='DE'>DE</option>
            <option value='FL'>FL</option>
            <option value='GA'>GA</option>
            <option value='HI'>HI</option>
            <option value='ID'>ID</option>
            <option value='IL'>IL</option>
            <option value='IN'>IN</option>
            <option value='IA'>IA</option>
            <option value='KS'>KS</option>
            <option value='KY'>KY</option>
            <option value='LA'>LA</option>
            <option value='ME'>ME</option>
            <option value='MD'>MD</option>
            <option value='MA'>MA</option>
            <option value='MI'>MI</option>
            <option value='MN'>MN</option>
            <option value='MS'>MS</option>
            <option value='MO'>MO</option>
            <option value='MT'>MT</option>
            <option value='NE'>NE</option>
            <option value='NV'>NV</option>
            <option value='NH'>NH</option>
            <option value='NJ'>NJ</option>
            <option value='NM'>NM</option>
            <option value='NY'>NY</option>
            <option value='NC'>NC</option>
            <option value='ND'>ND</option>
            <option value='OH'>OH</option>
            <option value='OK'>OK</option>
            <option value='OR'>OR</option>
            <option value='PA'>PA</option>
            <option value='RI'>RI</option>
            <option value='SC'>SC</option>
            <option value='SD'>SD</option>
            <option value='TN'>TN</option>
            <option value='TX'>TX</option>
            <option value='UT'>UT</option>
            <option value='VT'>VT</option>
            <option value='VA'>VA</option>
            <option value='WA'>WA</option>
            <option value='WV'>WV</option>
            <option value='WI'>WI</option>
            <option value='WY'>WY</option>
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
          onChange={props.findGender}
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
            type="number"
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