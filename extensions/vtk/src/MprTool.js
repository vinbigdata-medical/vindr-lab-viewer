import { vec3 } from 'gl-matrix';
import cornerstone, {
  getEnabledElement,
  metaData,
  loadAndCacheImage,
  getViewport,
  displayImage,
  updateImage,
} from 'cornerstone-core';
import cornerstoneTools, {
  getToolState,
  import as csTools,
  setToolDisabled,
  store,
} from 'vindr-tools';

import renderReferenceLine from './renderReferenceLine.js';
import getMprUrl from './lib/getMprUrl.js';

const BaseAnnotationTool = csTools('base/BaseAnnotationTool');
// const drawHandles = csTools('drawing/drawHandles');
const getNewContext = csTools('drawing/getNewContext');
// Util
const imagePointToPatientPoint = csTools('util/imagePointToPatientPoint');

/**
 * @export @public @class
 * @name AstCrossPoint
 * @classdesc
 * @extends BaseAnnotationTool
 */
export default class MprTool extends BaseAnnotationTool {
  constructor(configuration = {}) {
    const defaultConfig = {
      name: 'Mpr',
      supportedInteractionTypes: ['Mouse', 'Touch'],
      // TODO: Set when a tool is added
      options: {
        // mouseButtonMask: 1,
        preventHandleOutsideImage: true,
      },
      configuration: {
        shadow: true,
        shadowColor: '#000000',
        shadowOffsetX: 1,
        shadowOffsetY: 1,
        rotationAxis: 'Y',
      },
    };
    const initialConfiguration = Object.assign(defaultConfig, configuration);

    super(initialConfiguration);

    this.initialConfiguration = initialConfiguration;
    this.mergeOptions(initialConfiguration.options);

    //
    this.updatePoint = _updatePoint.bind(this);
    this.crossPoint = { x: 0, y: 0 };

    //
  }

  activeCallback(element, options) {
    cornerstoneTools.clearToolState(this.element, this.name);
    cornerstoneTools.addToolState(this.element, this.name, {
      visible: true,
      active: true,
      color: options.color,
      initCosines: options.cosines,
      appliedAngleRadians: 0,
      handles: {
        end: {
          x: 50,
          y: 50,
          highlight: true,
          active: true,
        },
      },
    });
  }

  passiveCallback(element, options) {
    setToolDisabled(this.name, options);
  }

  enabledCallback(element, options) {
    setToolDisabled(this.name, options);
  }

  disabledCallback(element, options) {
    // store.state.enabledElements.forEach(async enabledElement => {
    //   clearToolState(enabledElement, this.name)
    //   const isEnabled = await waitForElementToBeEnabled(enabledElement)
    //   const hasLoadedImage = await waitForEnabledElementImageToLoad(
    //     enabledElement
    //   )
    //   if (isEnabled && hasLoadedImage) {
    //     updateImage(enabledElement)
    //   }
    // })
  }

  // BaseAnnotationTool, despite no persistent
  pointNearTool() {
    return false;
  }

  /**
   *
   *
   * @param {*} evt
   * @returns
   */
  renderToolData(evt) {
    const eventData = evt.detail;
    const element = eventData.element;
    const image = cornerstone.getImage(element);
    const isMprImage = image.imageId.includes('mpr');

    if (!isMprImage) {
      return;
    }

    // const toolData = getToolState(element, this.name);
    const context = getNewContext(eventData.canvasContext.canvas);

    ///// -----------------
    store.state.enabledElements.forEach(refElement => {
      const image = cornerstone.getImage(element);
      const refImage = cornerstone.getImage(refElement);

      // duck out if target is us
      if (refElement === element) {
        return;
      }
      // Don't draw reference line for non-mpr
      if (!refImage || !refImage.imageId.includes('mpr')) {
        // console.warn('skipping; wrong image scheme');
        return;
      }

      // CURRENT
      const imagePlane = metaData.get('imagePlaneModule', image.imageId);
      // REFERENCE
      const refImagePlane = metaData.get('imagePlaneModule', refImage.imageId);
      const refToolState = getToolState(refElement, this.name).data[0];

      renderReferenceLine(context, element, imagePlane, refImagePlane, {
        color: refToolState && refToolState.color,
      });
    });
  }

  /**
   * We use the post mouse down hook so we don't accidentally prevent passive
   * tool manipulation.
   *
   * @param {*} evt
   * @returns {boolean} true - consumes event
   * @memberof AstCrossPoint
   */
  postMouseDownCallback(evt) {
    this.updatePoint(evt);
    evt.preventDefault();
    evt.stopPropagation();

    const consumeEvent = true;
    return consumeEvent;
  }

  mouseDragCallback(evt) {
    this.updatePoint(evt);
    evt.preventDefault();
    evt.stopPropagation();
  }

  mouseMoveCallback(evt) {
    return false;
  }

  postTouchStartCallback(evt) {
    this.updatePoint(evt);
    evt.preventDefault();
    evt.stopPropagation();

    const consumeEvent = true;
    return consumeEvent;
  }

  touchDragCallback(evt) {
    this.updatePoint(evt);
    evt.preventDefault();
    evt.stopPropagation();
  }

  _findAngle(toolData) {
    const crossPoint = this.crossPoint;
    const endPoint = toolData.data[0].handles.end;

    const dx = (endPoint.x - crossPoint.x) * 1; // colSpacing
    const dy = (endPoint.y - crossPoint.y) * 1; // rowSpacing
    const adjacent = Math.sqrt(dy * dy);
    const opposite = Math.sqrt(dx * dx);
    const angleInRadians = Math.atan(opposite / adjacent);
    const angleInDegrees = angleInRadians * (180 / Math.PI);

    return angleInRadians;
  }
}

/**
 *
 *
 * @param {*} evt
 * @returns
 */
const _updatePoint = async function(evt) {
  const eventData = evt.detail;
  evt.stopImmediatePropagation();

  const element = evt.currentTarget;
  const enabledElement = getEnabledElement(evt.currentTarget);
  const imageId = enabledElement.image.imageId;
  const imagePlane = metaData.get('imagePlaneModule', imageId);
  const imagePointXY = eventData.currentPoints.image;

  const { rows, columns } = imagePlane || {};
  const { x, y } = imagePointXY || {};
  if (x < 0 || x > columns || y < 0 || y > rows) {
    return;
  }

  // The point we've clicked is the "center" we want for our crosspoint;
  // However, our imageLoader uses the IPP as the "top left" for the slice
  // We need to calculate what the "top left" _would be_ if our clicked ipp
  // were in the center of a new slice
  // TODO: Replace this with an MPR specific version so we can use vec3
  // TODO: in metadata instead of old types?
  let ipp = imagePointToPatientPoint(imagePointXY, imagePlane);
  const originIPP = imagePlane.originIPP;
  const cX = `${originIPP[0]}`.split('.');
  const cY = `${originIPP[1]}`.split('.');
  const cZ = `${originIPP[2]}`.split('.');

  const ippX = `${ipp.x}`.split('.');
  const ippY = `${ipp.y}`.split('.');
  const ippZ = `${ipp.z}`.split('.');

  if (cX.length > 1) {
    ipp.x = parseFloat(`${ippX[0]}.${cX[1]}`).toFixed(6);
  } else {
    ipp.x = parseFloat(`${ippX[0]}`).toFixed(6);
  }
  if (cY.length > 1) {
    ipp.y = parseFloat(`${ippY[0]}.${cY[1]}`).toFixed(6);
  } else {
    ipp.y = parseFloat(`${ippY[0]}`).toFixed(6);
  }
  if (cZ.length > 1) {
    ipp.z = parseFloat(`${ippZ[0]}.${cZ[1]}`).toFixed(6);
  } else {
    ipp.z = parseFloat(`${ippZ[0]}`).toFixed(6);
  }

  const ippVec3 = [parseFloat(ipp.x), parseFloat(ipp.y), parseFloat(ipp.z)];

  // CROSSHAIR ONLY
  // const ippCross = imagePointToPatientPoint(imagePointXY, imagePlane);
  const ippCrossVec3 = vec3.fromValues(ipp.x, ipp.y, ipp.z);

  store.state.enabledElements.forEach(targetElement => {
    let targetImage;

    try {
      targetImage = cornerstone.getImage(targetElement);
    } catch (ex) {
      console.warn('target image is not enabled??');
      console.warn(ex);
      return;
    }

    if (targetElement === element) {
      return;
    }
    if (!targetImage.imageId.includes('mpr')) {
      // console.warn('skipping; wrong image scheme');
      return;
    }

    // Load image w/ same IOP, but w/ updated IPP
    const targetImagePlane = metaData.get(
      'imagePlaneModule',
      targetImage.imageId
    );
    const iopString = targetImagePlane.rowCosines
      .concat(targetImagePlane.columnCosines)
      .join();

    const ippString = [
      parseFloat(ippVec3[0].toFixed(6)),
      parseFloat(ippVec3[1].toFixed(6)),
      parseFloat(ippVec3[2].toFixed(6)),
    ];

    let mprImageId;
    if (targetElement.id === 'viewerMpr0') {
      mprImageId = getMprUrl(iopString, ippString[2]);
    } else if (targetElement.id === 'viewerMpr1') {
      mprImageId = getMprUrl(iopString, ippString[1]);
    } else {
      mprImageId = getMprUrl(iopString, ippString[0]);
    }

    // LOADS IMAGE
    loadAndCacheImage(mprImageId, { imagePosition: ippString.join() }).then(
      image => {
        displayImage(targetElement, image, getViewport(targetElement));
      }
    );

    // SET CROSS POINT
    const crossPoint = _projectPatientPointToImagePlane(
      ippCrossVec3,
      targetImagePlane
    );
    this.crossPoint = crossPoint;

    // Force redraw
    updateImage(targetElement);
  });

  // Force redraw on self
  updateImage(element);
};

function _projectPatientPointToImagePlane(patientPoint, imagePlane) {
  const rowCosines = imagePlane.rowCosines;
  const columnCosines = imagePlane.columnCosines;
  const imagePositionPatient = imagePlane.imagePositionPatient;

  const rowCosinesVec3 = vec3.fromValues(...rowCosines);
  const colCosinesVec3 = vec3.fromValues(...columnCosines);
  const ippVec3 = vec3.fromValues(...imagePositionPatient);

  const point = vec3.create();
  vec3.sub(point, patientPoint, ippVec3);

  const x = vec3.dot(rowCosinesVec3, point) / imagePlane.columnPixelSpacing;
  const y = vec3.dot(colCosinesVec3, point) / imagePlane.rowPixelSpacing;

  return { x, y };
}
