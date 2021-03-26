const displayFunction = data => {
  let meanValue = '';
  if (data.meanStdDev && data.meanStdDev.mean && !isNaN(data.meanStdDev.mean)) {
    meanValue = data.meanStdDev.mean.toFixed(2) + ' HU';
  }
  return meanValue;
};

export const brush = {
  id: 'Brush',
  name: 'Brush',
  toolGroup: 'allTools',
  cornerstoneToolType: 'Brush',
  options: {
    measurementTable: {
      displayFunction,
    },
    caseProgress: {
      include: true,
      evaluate: true,
    },
  },
};
