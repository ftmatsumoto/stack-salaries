import React from 'react';
import { TagCloud, defaultRenderer } from "react-tagcloud";

const data = [
  { value: "Angular", count: 38 },
  { value: "React", count: 30 },
  { value: "Nodejs", count: 28 },
  { value: "Express.js", count: 25 },
  { value: "HTML5", count: 33 },
  { value: "CSS3", count: 33 },
  { value: "MongoDB", count: 18 }
];

const Cloud = () => (
  <Cloud minSize={12}
            maxSize={35}
            tags={data}
            onClick={tag => console.log('clicking on tag:', tag)} />
);

export default Cloud;
