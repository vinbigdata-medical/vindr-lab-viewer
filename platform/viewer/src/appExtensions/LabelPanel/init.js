import OHIF from '@ohif/core';
import cornerstone from 'cornerstone-core';
import csTools from 'vindr-tools';
import throttle from 'lodash.throttle';
import get from 'lodash/get';

import LabellingFlow from '../../components/VinLabLabelling/VinLabLabellingFlow';
import ToolContextMenu from '../../connectedComponents/ToolContextMenu';
import AnnotationInfo from './components/AnnotationInfo/index';
import {
  updateAnnotation,
  cancelDrawing,
  undoFreehandPoint,
  isDrawingPoint,
  isEmpty,
  handleModifiedAnnotation,
  handleCompleteAnnotation,
} from '../../utils/helpers';
import { ANNOTATION_TOOLS, TOOL_TYPE } from '../../constants/constants';

const {
  onAdded,
  onRemoved,
  onModified,
} = OHIF.measurements.MeasurementHandlers;

let dialogBoxInfo;

const MEASUREMENT_ACTION_MAP = {
  added: event => {
    return onAdded(event);
  },
  removed: onRemoved,
  modified: throttle(event => {
    const measurementData = get(event, 'detail.measurementData') || {};
    const toolType = get(event, 'detail.toolType');
    handleModifiedAnnotation(measurementData, toolType);
    return onModified(event);
  }, 1000),
  labelmapModified: event => {
    // const module = csTools.getModule('segmentation');
    // const labelMap = module.getters.labelmap2D(event.target);
    // console.log({ labelMap });
    // const pixelDataCompressed = compressRLE(labelMap.labelmap2D.pixelData);
  },
};

// let timeoutCompleteId = null;

/**
 *
 *
 * @export
 * @param {Object} servicesManager
 * @param {Object} configuration
 */
export default function init({
  servicesManager,
  commandsManager,
  configuration,
}) {
  const { UIDialogService } = servicesManager.services;

  // TODO: MEASUREMENT_COMPLETED (not present in initial implementation)
  const onMeasurementsChanged = (action, event) => {
    return MEASUREMENT_ACTION_MAP[action](event);
  };
  const onMeasurementAdded = onMeasurementsChanged.bind(this, 'added');
  const onMeasurementRemoved = onMeasurementsChanged.bind(this, 'removed');
  const onMeasurementModified = onMeasurementsChanged.bind(this, 'modified');
  const onLabelmapModified = onMeasurementsChanged.bind(
    this,
    'labelmapModified'
  );

  const getNewPositionHover = (id, currentPos = {}) => {
    try {
      const windowHeight = window.innerHeight;
      const item = document.querySelector(`#draggableItem-${id}`);
      if (item) {
        const itemBounds = item.getBoundingClientRect();
        let newPos = { x: currentPos.x, y: currentPos.y };
        if (itemBounds.height + currentPos.y > windowHeight) {
          let offsetHight = itemBounds.height + currentPos.y - windowHeight;
          newPos.y = currentPos.y - offsetHight - 50;
          UIDialogService.updateLastPosition(newPos);
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  const _getHoverPopupPosition = (measurementData, element) => {
    const screenWidth = window.innerWidth;
    let x = (screenWidth - 320) / 2;
    let y = 150;

    try {
      const elmSideLeftPanel = document.querySelector('#jsSideLeftPanel');
      let boundElm =
        elmSideLeftPanel && elmSideLeftPanel.getBoundingClientRect();

      if (measurementData.toolType === TOOL_TYPE.BOUNDING_BOX) {
        const handleEnd = get(measurementData, 'handles.end');
        const handleStart = get(measurementData, 'handles.start');

        let leftPoint;
        let topPoint;
        if (handleEnd.x > handleStart.x) {
          leftPoint = cornerstone.pixelToCanvas(element, handleEnd);
        } else {
          leftPoint = cornerstone.pixelToCanvas(element, handleStart);
        }
        if (handleEnd.y > handleStart.y) {
          topPoint = cornerstone.pixelToCanvas(element, handleStart);
        } else {
          topPoint = cornerstone.pixelToCanvas(element, handleEnd);
        }

        if (leftPoint) {
          x = leftPoint.x + (boundElm.width || 100) + 5;
        }
        if (topPoint) {
          y = topPoint.y + 80;
        }
      } else if (measurementData.toolType === TOOL_TYPE.POLYGON) {
        const polyBoundingBox = get(measurementData, 'polyBoundingBox');
        if (polyBoundingBox) {
          const startCanvas = cornerstone.pixelToCanvas(element, {
            x: polyBoundingBox.left + polyBoundingBox.width,
            y: polyBoundingBox.top,
          });
          x = startCanvas.x + (boundElm.width || 100) + 5;
          y = startCanvas.y + 80;
        }
      }
    } catch (error) {
      console.log(error);
    }

    setTimeout(() => {
      getNewPositionHover('boxInfo', { x, y });
    }, 50);

    return { x, y };
  };

  function onHoverMeasurement(event) {
    const measurementData = get(event, 'detail.measurementData');

    if (!isEmpty(measurementData) && measurementData.isNearTool) {
      if (dialogBoxInfo) {
        clearTimeout(dialogBoxInfo);
      }

      UIDialogService.dismissAll();
      dialogBoxInfo = setTimeout(() => {
        const element = get(event, 'detail.element');

        UIDialogService.create({
          id: 'boxInfo',
          isDraggable: false,
          showOverlay: false,
          centralize: false,
          defaultPosition: _getHoverPopupPosition(measurementData, element),
          content: AnnotationInfo,
          contentProps: {
            measurementData,
          },
        });
      }, 0);
    } else {
      UIDialogService.dismiss({ id: 'boxInfo' });
    }
  }

  let mouseUpX = 0,
    mouseUpY = 0,
    mouseDownY = 0,
    mouseDownX = 0;

  const _getDefaultPosition = event => ({
    x: (event && event.currentPoints.client.x) || 0,
    y: (event && event.currentPoints.client.y) || 0,
  });

  const handleUpdateMeasurementData = (measurementData, element) => {
    if (!measurementData || !element) return;

    const measurementApi = OHIF.measurements.MeasurementApi.Instance;
    onModified({
      detail: {
        toolType: measurementData.toolType,
        measurementData,
        element,
      },
    });

    measurementApi.syncMeasurementsAndToolData();
    cornerstone.updateImage(element);
  };

  const showLabellingDialog = (
    props,
    contentProps,
    measurementData,
    element
  ) => {
    if (!UIDialogService) {
      console.warn('Unable to show dialog; no UI Dialog Service available.');
      return;
    }

    UIDialogService.create({
      id: 'labelling',
      isDraggable: false,
      showOverlay: true,
      centralize: true,
      content: LabellingFlow,
      contentProps: {
        measurementData,
        cancelLabellingCallback: () => {
          UIDialogService.dismissAll();
          onRemoved({
            detail: {
              toolType: measurementData.toolType,
              measurementData,
              element,
            },
          });
        },
        labellingDoneCallback: annotationData => {
          UIDialogService.dismissAll();
          if (annotationData) {
            handleCompleteAnnotation(annotationData);
            handleUpdateMeasurementData(
              {
                ...measurementData,
                ...annotationData,
              },
              element
            );
          }
        },
        ...contentProps,
      },
      ...props,
    });
  };

  const onRightClick = event => {
    if (!UIDialogService) {
      console.warn('Unable to show dialog; no UI Dialog Service available.');
      return;
    }

    UIDialogService.dismiss({ id: 'context-menu' });
    UIDialogService.create({
      id: 'context-menu',
      isDraggable: false,
      preservePosition: false,
      defaultPosition: _getDefaultPosition(event.detail),
      content: ToolContextMenu,
      contentProps: {
        eventData: event.detail,
        onDelete: (nearbyToolData, eventData) => {
          const element = eventData.element;
          const { tool = {} } = nearbyToolData;
          updateAnnotation(tool.annotationId, 'FINDING', tool._id);
          commandsManager.runCommand('removeToolState', {
            element,
            toolType: nearbyToolData.toolType,
            tool: nearbyToolData.tool,
          });
        },
        onClose: () => UIDialogService.dismiss({ id: 'context-menu' }),
      },
    });
  };

  const onTouchPress = event => {
    if (!UIDialogService) {
      console.warn('Unable to show dialog; no UI Dialog Service available.');
      return;
    }

    UIDialogService.create({
      eventData: event.detail,
      content: ToolContextMenu,
      contentProps: {
        isTouchEvent: true,
      },
    });
  };

  const onTouchStart = () => resetLabelligAndContextMenu();

  const onMouseClick = () => resetLabelligAndContextMenu();

  const resetLabelligAndContextMenu = () => {
    if (!UIDialogService) {
      console.warn('Unable to show dialog; no UI Dialog Service available.');
      return;
    }

    UIDialogService.dismiss({ id: 'context-menu' });
    UIDialogService.dismiss({ id: 'labelling' });
    UIDialogService.dismiss({ id: 'boxInfo' });
  };

  // TODO: This makes scrolling painfully slow
  // const onNewImage = ...

  /*
   * Because click gives us the native "mouse up", buttons will always be `0`
   * Need to fallback to event.which;
   *
   */
  const handleClick = cornerstoneMouseClickEvent => {
    const mouseUpEvent = cornerstoneMouseClickEvent.detail.event;
    const isRightClick = mouseUpEvent.which === 3;
    const enableElm = cornerstoneMouseClickEvent.target;

    if (isRightClick) {
      const { isToolActiveForElement } = csTools;
      if (
        enableElm &&
        isToolActiveForElement &&
        isToolActiveForElement(enableElm, TOOL_TYPE.POLYGON)
      ) {
        if (mouseUpEvent.ctrlKey) {
          cancelDrawing(TOOL_TYPE.POLYGON, enableElm);
        } else {
          undoFreehandPoint(TOOL_TYPE.POLYGON, enableElm);
        }
      }
      if (isDrawingPoint(TOOL_TYPE.POLYGON, enableElm)) {
        return;
      }

      onRightClick(cornerstoneMouseClickEvent);
    } else {
      onMouseClick(cornerstoneMouseClickEvent);
    }
  };

  const getNewPosition = (id, currentPos = {}) => {
    try {
      const labellingElement = document.getElementById(`draggableItem-${id}`);
      if (labellingElement) {
        let y = currentPos.y;
        let x = currentPos.x;
        const labelListHeight = labellingElement.offsetHeight;
        const windowHeight = window.innerHeight;
        const startToBottom = windowHeight - mouseDownY;
        if (startToBottom >= labelListHeight) {
          y = mouseDownY;
        } else if (mouseUpY <= labelListHeight) {
          y = 50;
        } else if (mouseUpY > labelListHeight) {
          y = mouseUpY - labelListHeight;
        }
        const screenHeight = window.screen.height;
        if (screenHeight <= 768 && screenHeight < labelListHeight + 50) {
          y = 0;
        }
        UIDialogService.updateLastPosition({ x, y });
      }
    } catch (error) {
      console.log(error);
    }
  };

  const _getLabelPopupPosition = (measurementData, toolType) => {
    const windowHeight = window.innerHeight;
    let y = 250;
    if (mouseDownY < windowHeight / 3) {
      y = mouseDownY;
    }
    let currentPos = { x: mouseUpX + 5, y };
    setTimeout(() => {
      getNewPosition('labelling', currentPos);
    }, 0);
    return currentPos;
  };

  const onComplete = event => {
    const element = get(event, 'detail.element');
    const toolType = get(event, 'detail.toolType');
    const measurementData = get(event, 'detail.measurementData') || {};

    if (!measurementData.annotationId && !measurementData.location) {
      if (ANNOTATION_TOOLS.includes(toolType)) {
        UIDialogService.dismissAll();
        setTimeout(() => {
          showLabellingDialog(
            {
              centralize: false,
              isDraggable: true,
              preservePosition: true,
              defaultPosition: _getLabelPopupPosition(
                measurementData,
                toolType
              ),
            },
            { skipAddLabelButton: true, editLocation: true, toolType },
            measurementData,
            element
          );
        }, 300);
      }
    }
  };

  function elementEnabledHandler(evt) {
    const element = evt.detail.element;

    element.addEventListener(
      csTools.EVENTS.MEASUREMENT_ADDED,
      onMeasurementAdded
    );
    element.addEventListener(
      csTools.EVENTS.MEASUREMENT_REMOVED,
      onMeasurementRemoved
    );
    element.addEventListener(
      csTools.EVENTS.MEASUREMENT_MODIFIED,
      onMeasurementModified
    );
    element.addEventListener(
      csTools.EVENTS.LABELMAP_MODIFIED,
      onLabelmapModified
    );

    const rootTarget = document.getElementById('root');

    rootTarget.addEventListener('mouseup', e => {
      mouseUpX = e.clientX;
      mouseUpY = e.clientY;
    });

    rootTarget.addEventListener('mousedown', e => {
      mouseDownX = e.clientX;
      mouseDownY = e.clientY;
    });

    element.addEventListener(csTools.EVENTS.TOUCH_PRESS, onTouchPress);
    element.addEventListener(csTools.EVENTS.MOUSE_CLICK, handleClick);
    element.addEventListener(csTools.EVENTS.TOUCH_START, onTouchStart);
    element.addEventListener(csTools.EVENTS.MEASUREMENT_COMPLETED, onComplete);
    element.addEventListener(csTools.EVENTS.MOUSE_HOVER, onHoverMeasurement);

    // TODO: This makes scrolling painfully slow
    // element.addEventListener(cornerstone.EVENTS.NEW_IMAGE, onNewImage);
  }

  function elementDisabledHandler(evt) {
    const element = evt.detail.element;

    element.removeEventListener(
      csTools.EVENTS.MEASUREMENT_ADDED,
      onMeasurementAdded
    );
    element.removeEventListener(
      csTools.EVENTS.MEASUREMENT_REMOVED,
      onMeasurementRemoved
    );
    element.removeEventListener(
      csTools.EVENTS.MEASUREMENT_MODIFIED,
      onMeasurementModified
    );
    element.removeEventListener(
      csTools.EVENTS.LABELMAP_MODIFIED,
      onLabelmapModified
    );

    element.removeEventListener(csTools.EVENTS.TOUCH_PRESS, onTouchPress);
    element.removeEventListener(csTools.EVENTS.MOUSE_CLICK, handleClick);
    element.removeEventListener(csTools.EVENTS.TOUCH_START, onTouchStart);
    element.removeEventListener(
      csTools.EVENTS.MEASUREMENT_COMPLETED,
      onComplete
    );
    element.removeEventListener(csTools.EVENTS.MOUSE_HOVER, onHoverMeasurement);

    // TODO: This makes scrolling painfully slow
    // element.removeEventListener(cornerstone.EVENTS.NEW_IMAGE, onNewImage);
  }

  cornerstone.events.addEventListener(
    cornerstone.EVENTS.ELEMENT_ENABLED,
    elementEnabledHandler
  );
  cornerstone.events.addEventListener(
    cornerstone.EVENTS.ELEMENT_DISABLED,
    elementDisabledHandler
  );
}
