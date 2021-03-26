import * as cornerstone from 'cornerstone-core';
import { vec3 } from 'gl-matrix';
//
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
//
import insertSlice from '../data/insertSlice.js';
import getSliceIndex from '../data/getSliceIndex.js';
import determineOrientation from '../data/determineOrientation.js';
import computeZAxis from '../data/computeZAxis.js';
import crossVectors from '../math/crossVectors.js';
import tryGetMetadataModuleAsync from '../tryGetMetadataModuleAsync.js';

/**
 * Note: This builds the vtk structure we need to move forward, but it does so using
 * only metadata for image ids in the series we're trying to create a volume for. That
 * mean's it's possible to do this step without having loaded any image data if we have
 * an alternate means for acquiring metadata
 *
 * @export
 * @param {*} seriesImageIds
 * @returns
 */
export default async function(seriesImageIds, imageDataObjectOrigin) {
  const {
    dimensions,
    orientation,
    multiComponent,
    spacing,
    zAxis,
  } = _calculateDimensions(imageDataObjectOrigin.metaDataMap);

  if (multiComponent) {
    throw new Error('Multi component image not supported by this plugin.');
  }

  const imageData = await _createVtkVolume(
    seriesImageIds,
    dimensions,
    spacing,
    zAxis,
    imageDataObjectOrigin
  );
  const centerIpp = _getVolumeCenterIpp(imageData);

  const imageDataObject = {
    imageIds: seriesImageIds,
    orientation,
    vtkImageData: imageData,
    centerIpp,
    zAxis,
  };

  return imageDataObject;
}

async function _createVtkVolume(
  seriesImageIds,
  dimensions,
  spacing,
  zAxis,
  imageDataObjectOrigin
) {
  // const imageData = vtkImageData.newInstance();
  const imageData = imageDataObjectOrigin.vtkImageData;
  const typedPixelArray = await _getTypedPixelArray(
    seriesImageIds[0],
    dimensions
  );
  const scalarArray = vtkDataArray.newInstance({
    name: 'Pixels',
    numberOfComponents: 1,
    values: typedPixelArray,
  });

  console.log('VOLUME ORIGIN: ', zAxis.origin);
  // imageData.setOrigin(zAxis.origin);
  // imageData.setDimensions(dimensions);
  // imageData.setSpacing(spacing);
  imageData.getPointData().setScalars(scalarArray);

  // Add our slices
  for (let i = 0; i < seriesImageIds.length; i++) {
    const imageId = seriesImageIds[i];

    const image = await cornerstone.loadAndCacheImage(imageId);
    const { imagePositionPatient } = await tryGetMetadataModuleAsync(
      'imagePlaneModule',
      imageId
    );

    const sliceIndex = getSliceIndex(zAxis, imagePositionPatient);

    insertSlice(imageData, image.getPixelData(), sliceIndex);

    // TODO: Inverting Slice Index: Vertical flips sagittal/coronal
    // const flipped = Math.abs(sliceIndex - seriesImageIds.length);
    // insertSlice(imageData, image.getPixelData().reverse(), flipped);

    // TODO: .reverse() vertically flips axial
    // TODO: Flip x/y spacing because of flip?
    // insertSlice(imageData, image.getPixelData().reverse(), sliceIndex);
  }

  // TODO: We can accidentally create multiple volumes if we try to create one
  // Before a request for the same series has completed.
  // (You'll notice this logs 3x -- one for each initial MPR canvas, but 0x after any load has finished)
  // console.log('~~~~~~~~~~ VTK imageData:', imageData);
  return imageData;
}

async function _getTypedPixelArray(imageId, dimensions) {
  const imagePixelModule = await tryGetMetadataModuleAsync(
    'imagePixelModule',
    imageId
  );
  const { bitsAllocated, pixelRepresentation } = imagePixelModule;
  const signed = pixelRepresentation === 1;

  if (bitsAllocated === 8) {
    if (signed) {
      throw new Error(
        '8 Bit signed images are not yet supported by this plugin.'
      );
    } else {
      throw new Error(
        '8 Bit unsigned images are not yet supported by this plugin.'
      );
    }
  }

  let typedPixelArray;
  if (bitsAllocated === 16) {
    // x, y, z
    typedPixelArray = signed
      ? new Int16Array(dimensions[0] * dimensions[1] * dimensions[2])
      : new Uint16Array(dimensions[0] * dimensions[1] * dimensions[2]);
  } else {
    throw new Error(`Unssuported bit: ${bitsAllocated}`);
  }

  return typedPixelArray;
}

function _calculateDimensions(metaDataMap) {
  const imagePlaneModule = metaDataMap.values().next().value;

  const { rowCosines, columnCosines } = imagePlaneModule;
  const crossProduct = crossVectors(columnCosines, rowCosines);
  const orientation = determineOrientation(crossProduct);
  const zAxis = computeZAxis(orientation, metaDataMap);

  const xSpacing = imagePlaneModule.columnPixelSpacing;
  const ySpacing = imagePlaneModule.rowPixelSpacing;
  const zSpacing = zAxis.spacing;

  const xVoxels = imagePlaneModule.columns;
  const yVoxels = imagePlaneModule.rows;
  const zVoxels = metaDataMap.size;

  // 3 === RGB?
  const multiComponent = imagePlaneModule.numberOfComponents > 1;

  return {
    dimensions: [xVoxels, yVoxels, zVoxels],
    orientation,
    multiComponent,
    spacing: [xSpacing, ySpacing, zSpacing],
    zAxis,
  };
}

/**
 * Calculates the center IPP for the volume. Useful for displaying
 * "best" slice on first render.
 *
 * @param {*} vtkImageData
 * @returns {Vec3} - Float32Array contain the volume's center IPP
 */
export function _getVolumeCenterIpp(vtkImageData) {
  const [x0, y0, z0] = vtkImageData.getOrigin();
  const [xSpacing, ySpacing, zSpacing] = vtkImageData.getSpacing();
  const [xMin, xMax, yMin, yMax, zMin, zMax] = vtkImageData.getExtent();

  const centerOfVolume = vec3.fromValues(
    x0 + xSpacing * 0.5 * (xMin + xMax),
    y0 + ySpacing * 0.5 * (yMin + yMax),
    z0 + zSpacing * 0.5 * (zMin + zMax)
  );

  return centerOfVolume;
}
