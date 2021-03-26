import createMprSlice from './lib/vtk/createMprSlice.js';
import mprMetaDataStore from './lib/mprMetadata/mprMetaDataStore.js';
import tryGetVtkVolumeForSeriesNumber from './lib/vtk/tryGetVtkVolumeForSeriesNumber.js';
import mapVtkSliceToCornerstoneImage from './lib/vtk/mapVtkSliceToCornerstoneImage.js';
import { utils } from '@ohif/core';
import get from 'lodash/get';

const { studyMetadataManager } = utils;

export default function(imageId, imageDataObject, option) {
  const imageLoadObject = {
    promise: undefined,
    cancelFn: undefined,
    decacheData: undefined,
  };

  imageLoadObject.promise = createImage(imageId, imageDataObject, option);

  return imageLoadObject;
}

async function createImage(imageId, imageDataObject, option) {
  const [
    scheme,
    seriesNumber,
    imageOrientationPatient,
    frameIndex,
  ] = imageId.split(':');
  const imagePosition = option && option.imagePosition;

  const vtkVolume = await tryGetVtkVolumeForSeriesNumber(
    seriesNumber,
    imageDataObject
  );
  const createSliceResult = createMprSlice(vtkVolume, {
    imageOrientationPatient,
    imagePositionPatient: imagePosition,
  });

  const { metaData = {} } = createSliceResult || {};
  const mappedSlice = mapVtkSliceToCornerstoneImage(createSliceResult.slice);

  _createMprMetaData(imageId, metaData);

  const {
    rescaleIntercept,
    rescaleSlope,
    windowWidth,
    windowCenter,
  } = _getMetaInstance();

  const image = {
    imageId,
    color: false,
    columnPixelSpacing: mappedSlice.columnPixelSpacing,
    rowPixelSpacing: mappedSlice.rowPixelSpacing,
    columns: mappedSlice.columns,
    width: mappedSlice.width,
    height: mappedSlice.height,
    rows: mappedSlice.rows,
    intercept: rescaleIntercept,
    invert: false,
    getPixelData: () => mappedSlice.pixelData,
    minPixelValue: mappedSlice.minPixelValue,
    maxPixelValue: mappedSlice.maxPixelValue,
    sizeInBytes: mappedSlice.sizeInBytes,
    slope: rescaleSlope,
    windowCenter: windowCenter,
    windowWidth: windowWidth,
    floatPixelData: undefined,
    isMpr: true,
    stepSize: metaData.imagePlaneModule && metaData.imagePlaneModule.stepSize,
    frameIndex: frameIndex ? parseFloat(frameIndex) : null,
    dataOrigin: imageDataObject.origin || [],
    dataSpacing: imageDataObject.spacing || [],
  };

  // set the ww/wc to cover the dynamic range of the image if no values are supplied
  if (image.windowCenter === undefined || image.windowWidth === undefined) {
    const maxVoi = image.maxPixelValue * image.slope + image.intercept;
    const minVoi = image.minPixelValue * image.slope + image.intercept;

    image.windowWidth = maxVoi - minVoi;
    image.windowCenter = (maxVoi + minVoi) / 2;
  }

  return image;
}

function _createMprMetaData(imageId, metaData) {
  mprMetaDataStore.set(imageId, metaData);
}

let instanceDataStore = new Map();
function _getMetaInstance() {
  const store = window.store.getState();
  const viewports = get(store, 'viewports') || {};
  const { activeViewportIndex, viewportSpecificData } = viewports;
  const activeViewportSpecificData = viewportSpecificData[activeViewportIndex];
  const {
    StudyInstanceUID,
    displaySetInstanceUID,
  } = activeViewportSpecificData;

  const meta = instanceDataStore.get(displaySetInstanceUID);

  if (meta) {
    return meta;
  }
  const studyMetadata = studyMetadataManager.get(StudyInstanceUID);
  const displaySetInstance = (studyMetadata.displaySets || []).find(
    ds => ds.displaySetInstanceUID === displaySetInstanceUID
  );
  const rescaleIntercept =
    get(displaySetInstance, 'images[0]._data.metadata.RescaleIntercept') || 0;
  const rescaleSlope =
    get(displaySetInstance, 'images[0]._data.metadata.RescaleSlope') || 1;
  const windowWidth = get(
    displaySetInstance,
    'images[0]._data.metadata.WindowWidth'
  );
  const windowCenter = get(
    displaySetInstance,
    'images[0]._data.metadata.WindowCenter'
  );
  const metaData = {
    rescaleIntercept,
    rescaleSlope,
    windowWidth: (Array.isArray(windowWidth) && windowWidth[0]) || windowWidth,
    windowCenter:
      (Array.isArray(windowCenter) && windowCenter[0]) || windowCenter,
  };

  instanceDataStore.set(displaySetInstanceUID, metaData);

  return metaData;
}
