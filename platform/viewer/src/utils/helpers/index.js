import get from 'lodash/get';
import cornerstoneTools from 'vindr-tools';
import OHIF from '@ohif/core';
import cornerstone from 'cornerstone-core';

import {
  ANNOTATION_STATUS,
  ANNOTATION_TOOLS,
  TASK_STATUS,
  TOOL_TYPE,
  MAP_TOOL_LABEL,
} from '../../constants/constants';
import { commandsManager } from '../../App';
import csTools from 'vindr-tools';
import { actionSetExtensionData } from '../../system/systemAction';
import { getMetaUIDs } from '../../appExtensions/LabelPanel/LabelPanelAction';

const has = Object.prototype.hasOwnProperty;

export const isDiff = (A, B) => JSON.stringify(A) !== JSON.stringify(B);

export const isEmpty = prop => {
  return (
    prop === null ||
    prop === undefined ||
    (has.call(prop, 'length') && prop.length === 0) ||
    (prop.constructor === Object && Object.keys(prop).length === 0)
  );
};

export function getTextByLanguage(array) {
  const i18nextLng = localStorage.getItem('i18nextLng');
  const result = array.find(item => item.lang === i18nextLng);

  return get(result, 'value');
}

// groupBy
export function groupBy(list, props) {
  return list.reduce((a, b) => {
    (a[b[props]] = a[b[props]] || []).push(b);
    return a;
  }, {});
}

// split Object Id
export function splitObjectId(id) {
  if (!id) return '';

  const dotIndex = id.indexOf('.');

  return id.slice(dotIndex + 1, id.length);
}

export const isActiveTool = toolName => {
  const store = window.store.getState();
  const viewports = get(store, 'viewports');
  if (!viewports) return false;
  try {
    const { isToolActiveForElement } = cornerstoneTools;
    const enabledElements = cornerstone.getEnabledElements();
    const enabledElement = enabledElements[viewports.activeViewportIndex];

    if (enabledElement && enabledElement.element) {
      return isToolActiveForElement(enabledElement.element, toolName);
    }
  } catch (error) {
    return false;
  }

  return false;
};

export const isEnableTool = toolName => {
  const store = window.store.getState();
  const viewports = get(store, 'viewports');
  if (!viewports) return false;
  try {
    const { getToolForElement } = cornerstoneTools;
    const enabledElements = cornerstone.getEnabledElements();
    const enabledElement = enabledElements[viewports.activeViewportIndex];

    if (enabledElement && enabledElement.element) {
      const tool = getToolForElement(enabledElement.element, toolName);
      return tool.mode === 'enabled';
    }
  } catch (error) {
    return false;
  }

  return false;
};

// disable tools
export function disableTools() {
  // disable all measurements here
  try {
    ANNOTATION_TOOLS.forEach(toolType => {
      if (isActiveTool(toolType) || !isEnableTool(toolType)) {
        cornerstoneTools.setToolPassive(toolType);
      }
    });
    if (!isActiveTool('Pan')) {
      cornerstoneTools.setToolActive('Pan', { mouseButtonMask: 4 });
    }
    if (!isActiveTool('Zoom')) {
      cornerstoneTools.setToolActive('Zoom', { mouseButtonMask: 2 });
    }
  } catch (error) {
    console.log(error);
  }
}

export function hasRole(role) {
  const store = window.store.getState();
  const people = get(store, 'extensions.session.projectDetail.people') || [];
  const userInfo = get(store, 'extensions.user');
  if (people.length && userInfo) {
    return (
      people.filter(
        user => user.id === userInfo.sub && user.roles.includes(role)
      ).length > 0
    );
  }
  return false;
}

export function isDisabled() {
  const store = window.store.getState();
  const currentTaskStatus = get(store, 'extensions.session.currentTask.status');

  if (currentTaskStatus) {
    const status = currentTaskStatus.toUpperCase();
    return status === TASK_STATUS.ARCHIVED || status === TASK_STATUS.COMPLETED;
  }
}

export const clearMeasurementData = () => {
  try {
    const store = window.store.getState();
    const viewports = get(store, 'viewports');
    const tools = ['RectangleRoi', 'FreehandRoi', 'Brush'];

    tools.forEach(tool => {
      const data = get(store, `timepointManager.measurements.${tool}`);
      if (viewports && data && data.length) {
        commandsManager.runCommand('clearAllAnnotations', data);
      }
    });

    //TODO: will be updated again
    const element = document.querySelector('.viewport-element');
    if (element) {
      const module = csTools.getModule('segmentation');
      const { labelmap3D } = module.getters.labelmap2D(element);
      const labelmaps2D = get(labelmap3D, 'labelmaps2D');

      if (!isEmpty(labelmaps2D)) {
        labelmaps2D.forEach(labelMap => {
          const pixelData = labelMap.pixelData;
          for (let p = 0; p < pixelData.length; p++) {
            if (pixelData[p] !== 0) {
              pixelData[p] = 0;
            }
          }
        });
        cornerstone.updateImage(element);
      }
    }
  } catch (error) {
    console.log(error);
  }
};

export const drawMeasurements = measurementData => {
  if (measurementData) {
    try {
      const measurementApi = OHIF.measurements.MeasurementApi.Instance;
      measurementApi.addMeasurements(measurementData);
      disableTools();
    } catch (error) {
      console.log(error);
    }
  }
};

//
// const generateNumber = (number, length) => {
//   return Array(length).fill(number);
// };

let intervalCheckLoadedImg = null;

export const drawSegmentations = (segmentations, viewports = {}) => {
  const { activeViewportIndex = 0, viewportSpecificData = {} } = viewports;
  const activeViewport = viewportSpecificData[activeViewportIndex] || {};

  if (segmentations && segmentations.length > 0 && !isEmpty(activeViewport)) {
    try {
      const firstImageId = getFirstImageId(
        activeViewport.StudyInstanceUID,
        activeViewport.displaySetInstanceUID
      );
      const { getters, setters } = cornerstoneTools.getModule('segmentation');

      if (intervalCheckLoadedImg) {
        clearInterval(intervalCheckLoadedImg);
      }

      let counter = 0;
      intervalCheckLoadedImg = setInterval(() => {
        counter++;
        if (counter === 1000) clearInterval(intervalCheckLoadedImg);

        const enabledElements = cornerstone.getEnabledElements();
        const enabledElement =
          enabledElements[activeViewportIndex] || enabledElements[0] || {};
        const { rows, columns } = enabledElement.image || {};

        if (enabledElement && enabledElement.image) {
          clearInterval(intervalCheckLoadedImg);
          segmentations.forEach((item, segIndex) => {
            const { masked_study_instance_uid, masked_series_instance_uid } =
              item.meta || {};
            if (
              activeViewport.StudyInstanceUID === masked_study_instance_uid &&
              activeViewport.SeriesInstanceUID === masked_series_instance_uid
            ) {
              const segmentRLE = get(item, 'data.segment');
              const activeSegmentIndex = get(item, 'data.activeSegmentIndex');
              const labelMapIndex = get(item, 'data.labelMapIndex');
              const imageIdIndex = get(item, 'data.imageIdIndex');

              const segment = segmentRLE.split(' ');

              setters.activeLabelmapIndex(
                enabledElement.element,
                labelMapIndex
              );
              const { labelmap3D } = getters.labelmap2D(enabledElement.element);

              const l2dforImageIdIndex = getters.labelmap2DByImageIdIndex(
                labelmap3D,
                imageIdIndex,
                rows,
                columns
              );

              let start = 0,
                end = 0;
              for (let i = 0; i < segment.length; i++) {
                const bitLength = segment[i];
                const bit = i % 2;

                start = end;
                end = start + parseInt(bitLength);

                for (let k = start; k < end; k++) {
                  if (bit === 1) {
                    l2dforImageIdIndex.pixelData[k] = activeSegmentIndex;
                  } else {
                    // l2dforImageIdIndex.pixelData[k] = 0;
                  }
                }
              }

              setters.updateSegmentsOnLabelmap2D(l2dforImageIdIndex);
              cornerstone.updateImage(enabledElement.element);
            }
          });

          const segmentsOnLabelmap = getSegmentsOnLabelmap(firstImageId);
          setters.activeSegmentIndex(
            enabledElement.element,
            segmentsOnLabelmap.length || 1
          );
        }
      }, 200);
    } catch (error) {
      console.log(error);
    }
  }
};

export const compressRLE = arr => {
  let arrayCompressed = [];
  let key = 0,
    idx = 0;

  if (arr[0] == 1) {
    arrayCompressed.push(0);
  }

  while (idx < arr.length) {
    if (arr[idx] === arr[idx + 1]) {
      key++;
    } else {
      arrayCompressed.push(key + 1);
      key = 0;
    }
    idx++;
  }

  return arrayCompressed.join(' ');
};

export const getImagePath = (
  StudyInstanceUID,
  SeriesInstanceUID,
  SOPInstanceUID,
  frameIndex = 0
) => {
  return [StudyInstanceUID, SeriesInstanceUID, SOPInstanceUID, frameIndex].join(
    '_'
  );
};

export const flattenPoints = (handles, toolType) => {
  if (isEmpty(handles)) return [];

  switch (toolType) {
    case TOOL_TYPE.POLYGON:
      return handles.points.map(point => ({
        x: point.x,
        y: point.y,
      }));
    case TOOL_TYPE.BOUNDING_BOX:
      return [
        {
          x: handles.start.x,
          y: handles.start.y,
        },
        {
          x: handles.end.x,
          y: handles.end.y,
        },
      ];
    default:
      return [];
  }
};

export function handleCompleteAnnotation(annotationData) {
  const toolType = annotationData.toolType;
  const store = window.store.getState();
  const user = get(store, 'extensions.user') || {};

  let pointsData;
  if (toolType === TOOL_TYPE.MASK) {
    pointsData = annotationData.data;
  } else {
    pointsData = flattenPoints(annotationData.handles, toolType);
  }

  const annotation = get(store, 'extensions.annotation');
  const FINDING = get(annotation, 'FINDING') || [];
  const metaUIDs = getMetaUIDs('IMAGE') || {};

  const polyBoundingBox =
    (toolType === TOOL_TYPE.POLYGON && annotationData.polyBoundingBox) ||
    undefined;

  if (metaUIDs.meta) {
    metaUIDs.meta.polyBoundingBox = polyBoundingBox;
    metaUIDs.meta.measurementId = annotationData._id;
  } else {
    metaUIDs.meta = {
      polyBoundingBox: polyBoundingBox,
      measurementId: annotationData._id,
    };
  }

  const newFindingItem = {
    ...metaUIDs,
    creator_id: user.sub,
    description: annotationData.description,
    data: pointsData,
    type: MAP_TOOL_LABEL[toolType],
    event: ANNOTATION_STATUS.CREATED,
    label_ids: annotationData.location,
  };

  FINDING.push(newFindingItem);

  annotation.FINDING = FINDING;

  window.store.dispatch(actionSetExtensionData('annotation', annotation));
}

export function handleModifiedAnnotation(measurementData, toolType) {
  if (!measurementData) return;
  let annotationId = get(measurementData, 'annotationId');
  const handles = get(measurementData, 'handles');
  const data = flattenPoints(handles, toolType);

  try {
    const store = window.store.getState();
    const annotation = get(store, 'extensions.annotation');
    const FINDING = get(annotation, 'FINDING') || [];

    let annotationIndex;
    let status;
    if (!annotationId) {
      status = ANNOTATION_STATUS.CREATED;
      annotationIndex = FINDING.findIndex(
        item => item.meta['measurementId'] === measurementData._id
      );
    } else {
      status = ANNOTATION_STATUS.UPDATED;
      annotationIndex = FINDING.findIndex(item => item['id'] === annotationId);
    }

    if (annotationIndex !== -1) {
      if (FINDING[annotationIndex].id) {
        status = ANNOTATION_STATUS.UPDATED;
      }

      FINDING[annotationIndex].data = data;
      FINDING[annotationIndex].event = status;

      if (measurementData.toolType === TOOL_TYPE.POLYGON) {
        if (FINDING[annotationIndex].meta) {
          FINDING[annotationIndex].meta.polyBoundingBox =
            measurementData.polyBoundingBox;
        } else {
          FINDING[annotationIndex].meta = {
            polyBoundingBox: measurementData.polyBoundingBox,
          };
        }
      }

      annotation.FINDING = FINDING;

      window.store.dispatch(actionSetExtensionData('annotation', annotation));
    }
  } catch (error) {
    console.log(error);
  }
}

export const updateAnnotation = (annotationId, type, _id) => {
  const store = window.store.getState();
  const annotation = get(store, 'extensions.annotation') || {};
  const newAnnotation = {
    ...annotation,
  };

  const list = get(annotation, type) || [];
  if (annotationId) {
    const filterIndex = list.findIndex(item => item.id === annotationId);
    if (list[filterIndex].event === ANNOTATION_STATUS.DELETED) {
      list[filterIndex].event = ANNOTATION_STATUS.UPDATED;
    } else {
      list[filterIndex].event = ANNOTATION_STATUS.DELETED;
    }

    newAnnotation[type] = list;
    window.store.dispatch(actionSetExtensionData('annotation', newAnnotation));
  } else if (_id) {
    const filterData = [];
    list.forEach(item => {
      if ((item.meta || {}).measurementId === _id) {
        // For case annotation saved on server
        if (item.id) {
          filterData.push({ ...item, event: ANNOTATION_STATUS.DELETED });
        }
      } else {
        filterData.push(item);
      }
    });

    newAnnotation[type] = filterData;
    window.store.dispatch(actionSetExtensionData('annotation', newAnnotation));
  }
};

export const toggleSegment = (tag = {}) => {
  const { setters } = csTools.getModule('segmentation');
  const element = document.querySelector('.viewport-element');
  if (setters && element) {
    setters.toggleSegmentVisibility(
      element,
      tag.activeSegmentIndex,
      tag.labelMapIndex
    );
  }
};

export const activeSegment = (tag = {}) => {
  const { setters } = csTools.getModule('segmentation');
  const element = document.querySelector('.viewport-element');
  if (setters && element) {
    setters.activeLabelmapIndex(element, tag.labelMapIndex);
    setters.activeSegmentIndex(element, tag.activeSegmentIndex);
  }
};

export const deleteSegment = (tag = {}, imageId) => {
  const { setters } = cornerstoneTools.getModule('segmentation');
  const element = document.querySelector('.viewport-element');
  if (element) {
    setters.deleteSegment(
      element,
      tag.activeSegmentIndex,
      tag.labelMapIndex || 0
    );

    if (imageId) {
      const segmentsOnLabelmap = getSegmentsOnLabelmap(imageId);
      setters.activeSegmentIndex(element, segmentsOnLabelmap.length || 1);
    }
    cornerstone.updateImage(element);
  }
};

export const getFirstImageId = (StudyInstanceUID, displaySetInstanceUID) => {
  const { utils } = OHIF;
  const { studyMetadataManager } = utils;
  const studyMetadata = studyMetadataManager.get(StudyInstanceUID);
  const firstImageId = studyMetadata.getFirstImageId(displaySetInstanceUID);
  return firstImageId;
};

export const getSegmentsOnLabelmap = firstImageId => {
  const { state } = cornerstoneTools.getModule('segmentation');
  const brushStackState = state.series[firstImageId];
  if (brushStackState) {
    const { labelmaps2D } = brushStackState.labelmaps3D[0] || {};
    const { segmentsOnLabelmap = [] } = labelmaps2D[0] || {};
    return segmentsOnLabelmap;
  }
  return [];
};

export const cancelDrawing = (toolName, enableElement) => {
  if (!toolName || !enableElement) return;
  try {
    const { store = {} } = csTools;
    const { state = {} } = store;
    const { tools = [] } = state;
    const tool = tools.find(it => it.name === toolName);
    if (tool && tool._drawing && tool.cancelDrawing) {
      tool.cancelDrawing(enableElement);
    }
  } catch (error) {
    console.log(error);
  }
};

export const undoFreehandPoint = (toolName, enableElement) => {
  if (!toolName || !enableElement) return;
  try {
    const tool = csTools.getToolForElement(enableElement, toolName);
    const activeDrawing = (tool || {})._activeDrawingToolReference;
    if (
      activeDrawing &&
      activeDrawing.handles &&
      (activeDrawing.handles.points || []).length > 1
    ) {
      const configuration = tool._configuration;

      if (configuration.currentHandle > 1) {
        const len = activeDrawing.handles.points.length;
        activeDrawing.handles.points.length = len - 1;
        activeDrawing.handles.points[len - 2].lines = [];
        configuration.currentHandle = configuration.currentHandle - 1;
        cornerstone.updateImage(enableElement);
      }
    }
  } catch (error) {
    console.log(error);
  }
};

export const isDrawingPoint = (toolName, enableElement) => {
  if (!toolName || !enableElement) return;
  try {
    const tool = csTools.getToolForElement(enableElement, toolName);
    const activeDrawing = (tool || {})._activeDrawingToolReference;
    return !!activeDrawing;
  } catch (error) {
    console.log(error);
  }
  return false;
};

export const blurActiveElement = () => {
  if (document.activeElement) {
    document.activeElement.blur();
  }
};

export const uuidv4 = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    let r = (Math.random() * 16) | 0,
      v = c == 'x' ? r : (r & 0x3) | 0x8;

    return v.toString(16);
  });
};

export const refreshCornerstoneViewports = () => {
  cornerstone.getEnabledElements().forEach(enabledElement => {
    if (enabledElement.image) {
      cornerstone.updateImage(enabledElement.element);
    }
  });
};

export const isDisplaySetReconstructable = (
  viewportSpecificData = {},
  activeViewportIndex
) => {
  if (!viewportSpecificData[activeViewportIndex]) {
    return false;
  }

  const { displaySetInstanceUID, StudyInstanceUID } = viewportSpecificData[
    activeViewportIndex
  ];

  const { utils } = OHIF;
  const { studyMetadataManager } = utils;
  const studies = studyMetadataManager.all();

  const study = studies.find(
    study => study.studyInstanceUID === StudyInstanceUID
  );

  if (!study) {
    return false;
  }

  const displaySet = study._displaySets.find(
    set => set.displaySetInstanceUID === displaySetInstanceUID
  );

  if (!displaySet) {
    return false;
  }

  return displaySet.isReconstructable;
};

export const activeCrosshearTool = () => {
  let enbElm = cornerstone.getEnabledElements() || [];
  [...enbElm].forEach(el => {
    let color = '';
    let cosines = '';

    if (el.element.id === 'viewerMpr0') {
      color = '#9ACD32';
      cosines = '1,0,0,0,1,0';
    } else if (el.element.id === 'viewerMpr1') {
      color = '#0496FF';
      cosines = '1,0,0,0,0,-1';
    } else if (el.element.id === 'viewerMpr2') {
      color = '#EFBDEB';
      cosines = '0,1,0,0,0,-1';
    }
    if (color && cosines) {
      csTools.setToolActiveForElement(el.element, 'Mpr', {
        mouseButtonMask: 1,
        color,
        cosines,
      });
    }
  });
};
