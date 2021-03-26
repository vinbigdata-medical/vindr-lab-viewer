const scheme = 'mpr';
const seriesNumber = 0;
let studyInstanceUID = '';
let seriesInstanceUID = '';

export default function(
  imageOrientationPatient,
  imagePosititionPatient = 'center'
) {
  let newImageOrientation = imageOrientationPatient;
  // if (imageOrientationPatient) {
  //   let pos = imageOrientationPatient.split(',');
  //   newImageOrientation = pos.map(ps => Math.round(ps)).join(',');
  // }
  let newImagePos = imagePosititionPatient;
  // if (imagePosititionPatient !== 'center') {
  //   let pos = imagePosititionPatient.split(',');
  //   newImagePos = pos.map(ps => Math.round(ps)).join(',');
  // }
  return `${scheme}:${seriesInstanceUID}:${newImageOrientation}:${newImagePos}:${studyInstanceUID}/${seriesInstanceUID}`;
}

export const setStudyInfo = (_studyInstanceUID, _seriesInstanceUID) => {
  studyInstanceUID = _studyInstanceUID;
  seriesInstanceUID = _seriesInstanceUID;
};
