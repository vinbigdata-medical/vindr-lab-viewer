import CornerstoneViewport from 'react-vinlab-viewport';
import OHIF from '@ohif/core';
import { connect } from 'react-redux';
import throttle from 'lodash.throttle';
import cornerstone from 'cornerstone-core';
import { message } from 'antd';
import get from 'lodash/get';
import { commandsManager, servicesManager } from '@ohif/viewer/src/App';
import VinLabLabellingFlow from '@ohif/viewer/src/components/VinLabLabelling/VinLabLabellingFlow';
import { setEnabledElement } from './state';
import {
  updateAnnotation,
  isDisabled,
  toggleSegment,
  activeSegment,
  deleteSegment,
} from '@ohif/viewer/src/utils/helpers';
import {
  ANNOTATION_STATUS,
  TOOL_TYPE,
} from '@ohif/viewer/src/constants/constants';
import { actionSetExtensionData } from '@ohif/viewer/src/system/systemAction';

const { setViewportActive, setViewportSpecificData } = OHIF.redux.actions;
const {
  onAdded,
  onRemoved,
  onModified,
} = OHIF.measurements.MeasurementHandlers;

// TODO: Transition to enums for the action names so that we can ensure they stay up to date
// everywhere they're used.
const MEASUREMENT_ACTION_MAP = {
  added: onAdded,
  removed: onRemoved,
  modified: throttle(event => {
    return onModified(event);
  }, 300),
};

const mapStateToProps = (state, ownProps) => {
  let dataFromStore;

  // TODO: This may not be updated anymore :thinking:
  if (state.extensions && state.extensions.cornerstone) {
    dataFromStore = state.extensions.cornerstone;
  }

  // If this is the active viewport, enable prefetching.
  const { viewportIndex } = ownProps; //.viewportData;
  const isActive = viewportIndex === state.viewports.activeViewportIndex;
  const viewportSpecificData =
    state.viewports.viewportSpecificData[viewportIndex] || {};

  // CINE
  let isPlaying = false;
  let frameRate = 24;

  if (viewportSpecificData && viewportSpecificData.cine) {
    const cine = viewportSpecificData.cine;

    isPlaying = cine.isPlaying === true;
    frameRate = cine.cineFrameRate || frameRate;
  }

  return {
    // layout: state.viewports.layout,
    isActive,
    // TODO: Need a cleaner and more versatile way.
    // Currently justing using escape hatch + commands
    // activeTool: activeButton && activeButton.command,
    ...dataFromStore,
    isStackPrefetchEnabled: isActive,
    isPlaying,
    frameRate,
    //stack: viewportSpecificData.stack,
    // viewport: viewportSpecificData.viewport,
    isOverlayVisible: state.extensions.settings.isVisibleAnnotation,
    measurements: state.timepointManager.measurements,
    isVisibleLocalTag: state.extensions.settings.isVisibleLocalTag,
    isVisibleAllTag: state.extensions.settings.isVisibleAllTag,
    tagAllText: '',
    tagProps: {
      activeBgColor: 'var(--app-primary-color)',
      showTagColorByBox: true,
    },
    tagStyles: {
      color: '#fbfbfb',
      borderColor: 'darkcyan',
      background: 'var(--box-background-color)',
    },
  };
};

const mapDispatchToProps = (dispatch, ownProps) => {
  const { viewportIndex, imageIds } = ownProps;
  const measurementApi = OHIF.measurements.MeasurementApi.Instance;

  const onActiveTag = (tag, forceActive) => {
    if (tag) {
      const isSelected = forceActive || !tag.selected;
      Object.keys(measurementApi.tools).forEach(toolType => {
        const measurements = measurementApi.tools[toolType];

        measurements.forEach(measurement => {
          measurement.selected = false;
        });
      });

      if (tag.toolType === TOOL_TYPE.MASK) {
        activeSegment(tag);
      }

      measurementApi.updateMeasurement(tag.toolType, {
        ...tag,
        selected: isSelected,
      });

      measurementApi.syncMeasurementsAndToolData();

      cornerstone.getEnabledElements().forEach(enabledElement => {
        cornerstone.updateImage(enabledElement.element);
      });
    }
  };

  const getNewPosition = (id, currentPos = {}) => {
    try {
      const windowHeight = window.innerHeight;
      const item = document.querySelector(`#draggableItem-${id}`);
      const itemBounds = item.getBoundingClientRect();

      let newPos = { x: currentPos.x, y: currentPos.y };
      if (itemBounds.height + currentPos.y > windowHeight) {
        let offsetHight = itemBounds.height + currentPos.y - windowHeight;
        newPos.y = currentPos.y - offsetHight - 50;
      }

      const { UIDialogService } = servicesManager.services;
      UIDialogService.updateLastPosition(newPos);
    } catch (error) {
      console.log(error);
    }
  };

  const _getLabelPopupPosition = measurementData => {
    const screenWidth = window.innerWidth;
    let x = (screenWidth - 320) / 2;
    let tempY = 150,
      y = 150;

    try {
      let element = document.querySelector('.viewport-element');
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
          y = topPoint.y + 75;
        }
      } else if (measurementData.toolType === TOOL_TYPE.POLYGON) {
        const polyBoundingBox = get(measurementData, 'polyBoundingBox');
        if (polyBoundingBox) {
          const startCanvas = cornerstone.pixelToCanvas(element, {
            x: polyBoundingBox.left + polyBoundingBox.width,
            y: polyBoundingBox.top,
          });
          x = startCanvas.x + (boundElm.width || 100) + 5;
          y = startCanvas.y + 75;
        }
      }
    } catch (error) {
      console.log(error);
    }

    setTimeout(() => {
      getNewPosition('labelling', { x, y });
    }, 0);

    return { x, y: tempY };
  };

  const showLabellingDialog = measurementData => {
    const { UIDialogService } = servicesManager.services;
    if (!UIDialogService) {
      return;
    }
    UIDialogService.dismissAll();

    setTimeout(() => {
      UIDialogService.create({
        id: 'labelling',
        isDraggable: true,
        showOverlay: false,
        centralize: false,
        defaultPosition: _getLabelPopupPosition(measurementData),
        content: VinLabLabellingFlow,
        contentProps: {
          actionType: 'UPDATE',
          measurementData,
          toolType: measurementData.toolType,
          cancelLabellingCallback: () => UIDialogService.dismissAll(),
          labellingDoneCallback: measurementData => {
            if (measurementData) {
              const labelIds = get(measurementData, 'location');
              let annotationId = get(measurementData, 'annotationId');
              const description = get(measurementData, 'description');

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
                  annotationIndex = FINDING.findIndex(
                    item => item['id'] === annotationId
                  );
                }

                if (annotationIndex !== -1) {
                  if (FINDING[annotationIndex].id) {
                    status = ANNOTATION_STATUS.UPDATED;
                  }
                  FINDING[annotationIndex].label_ids = labelIds;
                  FINDING[annotationIndex].description = description;
                  FINDING[annotationIndex].event = status;

                  annotation.FINDING = FINDING;

                  window.store.dispatch(
                    actionSetExtensionData('annotation', annotation)
                  );
                }
              } catch (error) {
                console.log(error);
              }

              UIDialogService.dismiss({ id: 'labelling' });
            }
          },
          updateLabelling: ({
            location,
            locationLabel,
            description,
            response,
            color,
          }) => {
            measurementData.location = location || measurementData.location;
            measurementData.locationLabel =
              locationLabel || measurementData.locationLabel;
            measurementData.description = description || '';
            measurementData.response = response || measurementData.response;
            measurementData.color = color || measurementData.color;

            const { MeasurementHandlers } = OHIF.measurements;

            MeasurementHandlers.onModified({
              detail: {
                toolType: measurementData.toolType,
                measurementData: {
                  _id: measurementData._id,
                  lesionNamingNumber: measurementData.lesionNamingNumber,
                  measurementNumber: measurementData.measurementNumber,
                  locationLabel: measurementData.locationLabel,
                  description: description,
                },
                element: document.querySelector('.viewport-element'),
              },
            });

            commandsManager.runCommand(
              'updateTableWithNewMeasurementData',
              measurementData
            );
          },
        },
      });
    }, 100);
  };

  return {
    setViewportActive: () => {
      dispatch(setViewportActive(viewportIndex));
    },

    setViewportSpecificData: data => {
      dispatch(setViewportSpecificData(viewportIndex, data));
    },

    /**
     * Our component "enables" the underlying dom element on "componentDidMount"
     * It listens for that event, and then emits the enabledElement. We can grab
     * a reference to it here, to make playing with cornerstone's native methods
     * easier.
     */
    onElementEnabled: event => {
      const enabledElement = event.detail.element;
      setEnabledElement(viewportIndex, enabledElement);
      dispatch(
        setViewportSpecificData(viewportIndex, {
          // TODO: Hack to make sure our plugin info is available from the outset
          plugin: 'cornerstone',
        })
      );
    },

    onMeasurementsChanged: (event, action) => {
      return MEASUREMENT_ACTION_MAP[action](event);
    },
    handleToggleBox: tag => {
      if (tag) {
        if (tag.toolType === TOOL_TYPE.MASK) {
          toggleSegment(tag);
        }

        measurementApi.updateMeasurement(tag.toolType, {
          ...tag,
          visible: !tag.visible,
        });
        measurementApi.syncMeasurementsAndToolData();

        cornerstone.getEnabledElements().forEach(enabledElement => {
          cornerstone.updateImage(enabledElement.element);
        });
      }
    },

    handleActiveBox: tag => {
      onActiveTag(tag);
    },

    handleDeleteBox: async tag => {
      if (!isDisabled()) {
        const { MeasurementHandlers } = OHIF.measurements;

        try {
          updateAnnotation(tag.annotationId, 'FINDING', tag._id);
          MeasurementHandlers.onRemoved({
            detail: {
              toolType: tag.toolType,
              measurementData: {
                _id: tag._id,
                lesionNamingNumber: tag.lesionNamingNumber,
                measurementNumber: tag.measurementNumber,
              },
            },
          });

          Object.keys(measurementApi.tools).forEach(toolType => {
            const measurements = measurementApi.tools[toolType];

            measurements.forEach(measurement => {
              commandsManager.runCommand(
                'updateTableWithNewMeasurementData',
                measurement
              );
            });
          });
          if (tag.toolType === TOOL_TYPE.MASK) {
            deleteSegment(tag, imageIds[0]);
          }
        } catch (error) {
          message.error('error');
        }
      } else {
        message.error('Error, this task already completed.');
      }
    },

    handleEditBox: tag => {
      if (tag && !tag.visible) return;
      onActiveTag(tag, true);

      if (!isDisabled()) {
        showLabellingDialog(tag);
      } else {
        message.error('Error, this task already completed.');
      }
    },
  };
};

const ConnectedCornerstoneViewport = connect(
  mapStateToProps,
  mapDispatchToProps
)(CornerstoneViewport);

export default ConnectedCornerstoneViewport;
