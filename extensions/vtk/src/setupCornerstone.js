import * as cornerstone from 'cornerstone-core';
import * as cornerstoneTools from 'vindr-tools';
import mprMetaDataProvider from './lib/mprMetadata/mprMetaDataProvider.js';
import mprImageLoader from './mprImageLoader.js';
import MprTool from './MprTool.js';
import MprMouseWheelTool from './MprMouseWheelTool.js';

export default function(viewportIndex, imageDataObject) {
  cornerstone.registerImageLoader('mpr', (imgId, option) => {
    return mprImageLoader(imgId, imageDataObject, option);
  });
  cornerstone.metaData.addProvider(mprMetaDataProvider);
  _initMprTools(viewportIndex);
}

function _initMprTools(viewportIndex) {
  // Enable Elements
  const elm = document.getElementById(`viewerMpr${viewportIndex}`);

  cornerstone.enable(elm);

  let rotationAxis = 'Y';
  let color = '#9ACD32';
  let cosines = '1,0,0,0,1,0';
  let direction = 'axial';
  if (viewportIndex === 1) {
    color = '#0496FF';
    cosines = '1,0,0,0,0,-1';
    rotationAxis = 'X';
    direction = 'coronal';
  } else if (viewportIndex === 2) {
    color = '#EFBDEB';
    cosines = '0,1,0,0,0,-1';
    rotationAxis = 'X';
    direction = 'sagittal';
  }

  cornerstoneTools.addToolForElement(elm, MprTool, {
    configuration: { rotationAxis: rotationAxis, direction: direction },
  });
  cornerstoneTools.addToolForElement(elm, MprMouseWheelTool);

  // Track data for this tool using STACK state
  cornerstoneTools.addStackStateManager(elm, ['Mpr']);
  cornerstoneTools.setToolActiveForElement(elm, 'MprMouseWheel', {});

  cornerstoneTools.setToolActiveForElement(elm, 'Mpr', {
    mouseButtonMask: 1,
    color,
    cosines,
  });
}
