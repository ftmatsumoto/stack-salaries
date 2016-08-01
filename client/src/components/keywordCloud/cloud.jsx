import React from 'react';
import { TagCloud, defaultRenderer } from "react-tagcloud";

const data = [
  { value: "Angular", count: 38 },
  { value: "React", count: 30 },
  { value: "Nodejs", count: 28 },
  { value: "Express.js", count: 25 },
  { value: "HTML5", count: 33 },
  { value: "CSS3", count: 33 },
  { value: "MongoDB", count: 18 },
  { value: "MEAN", count: 50 },
  { value: "JavaScript", count: 70 },
  { value: "PHP", count: 30 },
  { value: "JQuery", count: 40 },
  { value: "MERN", count: 20 },
  { value: "Vue", count: 10 },
  { value: "Backbone", count: 10 }
];

const renderer = defaultRenderer({
  colorOptions: {
    luminosity: 'light',
    hue: 'green'
  }
});

const Cloud = (props) => (
  <TagCloud renderer={renderer}
            minSize={12}
            maxSize={35}
            tags={data}
            className="stackCloud"
            onClick={tag => console.log('clicking on tag:', tag)} />
);

export default Cloud;
