import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import cornerstone from 'cornerstone-core';
import cornerstoneTools from 'vindr-tools';
import { mat4 } from 'gl-matrix';
import getMprUrl, { setStudyInfo } from './lib/getMprUrl';
import { _getVolumeCenterIpp } from './lib/vtk/createVtkVolumeAsync';
import setupCornerstone from './setupCornerstone.js';
import { setSerires } from './appState';

import './VTKViewport.css';

const VTKViewport = props => {
  const style = { width: '100%', height: '100%', position: 'relative' };

  useEffect(() => {
    setTimeout(() => {
      const stack = props.stack;
      const imageDataObject = props.imageDataObject;
      const centerOfVolume = _getVolumeCenterIpp(imageDataObject.vtkImageData);

      let newCenterOfVolume = [];
      centerOfVolume.forEach(v => {
        newCenterOfVolume.push(parseFloat(v.toFixed(6)));
      });

      const viewportIndex = props.viewportIndex;
      setSerires(props.seriesInstanceUID, stack.imageIds);
      setStudyInfo(props.studyInstanceUID, props.seriesInstanceUID);
      setupCornerstone(viewportIndex, imageDataObject);

      const elm = document.getElementById(`viewerMpr${viewportIndex}`);

      let mprUrl = '';
      if (viewportIndex === 0) {
        const axial = mat4.create();
        const axialIop = new Float32Array([
          axial[0],
          axial[1],
          axial[2],
          axial[4],
          axial[5],
          axial[6],
        ]);
        let iop = axialIop.join();
        let pos = newCenterOfVolume[2];
        mprUrl = getMprUrl(iop, pos);
      } else if (viewportIndex === 1) {
        const coronalIop = new Float32Array([1, 0, 0, 0, 0, -1]);
        let iop = coronalIop.join();
        let pos = newCenterOfVolume[1];
        mprUrl = getMprUrl(iop, pos);
      } else if (viewportIndex === 2) {
        const sagittalIop = new Float32Array([0, 1, 0, 0, 0, -1]);
        let iop = sagittalIop.join();
        let pos = newCenterOfVolume[0];
        mprUrl = getMprUrl(iop, pos);
      }

      const canvasStack = {
        currentImageIdIndex: 0,
        imageIds: stack.imageIds,
      };

      cornerstone
        .loadAndCacheImage(mprUrl, { imagePosition: newCenterOfVolume.join() })
        .then(image => {
          let defViewport = cornerstone.getDefaultViewport(elm, image);
          defViewport.labelmap = false;
          cornerstone.displayImage(elm, image, defViewport);
          cornerstone.fitToWindow(elm);
          cornerstoneTools.addStackStateManager(elm, ['stack']);
          cornerstoneTools.addToolState(elm, 'stack', canvasStack);
        });
    }, 0);
  }, []);

  return (
    <div
      id={`viewerMpr${props.viewportIndex}`}
      style={style}
      onContextMenu={e => {
        e.preventDefault();
        return false;
      }}
    ></div>
  );
};

VTKViewport.propTypes = {
  setViewportActive: PropTypes.func.isRequired,
  viewportIndex: PropTypes.number.isRequired,
  activeViewportIndex: PropTypes.number.isRequired,
};

export default VTKViewport;
