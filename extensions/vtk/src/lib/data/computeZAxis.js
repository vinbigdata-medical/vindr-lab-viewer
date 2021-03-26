import mean from '../math/mean.js';
import diff from '../math/diff.js';

// Given the orientation, determine the coordinates of the z axis
// i.e. the z axis per the DICOM xray or other device relative to the
// patient. Also, determine the average spacing along that axis, and
// return the index (0,1,2) of the z axis.
export default function(orientation, metaData) {
  const ippArray = [];
  const xyzIndex = determineOrientationIndex(orientation);

  for (var value of metaData.values()) {
    let ipp = value.imagePositionPatient;
    if (xyzIndex === 0) {
      ippArray.push(ipp.x || ipp[0]);
    } else if (xyzIndex === 1) {
      ippArray.push(ipp.y || ipp[1]);
    } else {
      ippArray.push(ipp.z || ipp[2]);
    }
  }

  ippArray.sort(function(a, b) {
    return a - b;
  });
  const meanSpacing = mean(diff(ippArray));

  // Find origin from positions
  const originPositionAlongAcqAxis = ippArray[0];
  const originImagePlane = Array.from(metaData.values()).find(meta => {
    return meta.imagePositionPatient[xyzIndex] === originPositionAlongAcqAxis;
  });

  var obj = {
    spacing: meanSpacing,
    positions: ippArray,
    origin: originImagePlane.imagePositionPatient,
    xyzIndex,
  };
  return obj;
}

// given the text orientation, determine the index (0,1,2)
// of the z axis
function determineOrientationIndex(orientation) {
  switch (orientation) {
    case 'A':
    case 'P':
      return 1;
    case 'L':
    case 'R':
      return 0;
    case 'S':
    case 'I':
      return 2;
    default:
      throw new Error('Oblique acquisitions are not currently supported.');
  }
}
