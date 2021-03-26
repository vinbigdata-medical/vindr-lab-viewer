import OHIF, { redux, utils } from '@ohif/core';
import cornerstoneTools from 'vindr-tools';

import store from './../../store';
import { getEnabledElement } from '@ohif/extension-cornerstone/src/state';
import cornerstone from 'cornerstone-core';
import { actionSetSelectedTool } from '../../system/systemAction';

const commandsModule = ({ commandsManager, servicesManager }) => {
  const { setViewportActive, setActiveViewportSpecificData } = redux.actions;

  const actions = {
    updateActiveViewport: ({ viewports, direction }) => {
      const { viewportSpecificData, activeViewportIndex } = viewports;
      const maxIndex = Object.keys(viewportSpecificData).length - 1;

      let newIndex = activeViewportIndex + direction;
      newIndex = newIndex > maxIndex ? 0 : newIndex;
      newIndex = newIndex < 0 ? maxIndex : newIndex;

      store.dispatch(setViewportActive(newIndex));
    },
    setWindowLevelPreset: ({ viewports, preset }) => {
      if (Number(preset) === 0) {
        commandsManager.runCommand('resetViewport');
      } else {
        const state = store.getState();
        const { preferences = {} } = state;
        const { window, level } =
          preferences.windowLevelData && preferences.windowLevelData[preset];

        const enabledElement = getEnabledElement(viewports.activeViewportIndex);

        if (enabledElement) {
          let viewport = cornerstone.getViewport(enabledElement);
          viewport.voi = {
            windowWidth: Number(window),
            windowCenter: Number(level),
          };
          cornerstone.setViewport(enabledElement, viewport);
        }
      }
    },
    updateViewportDisplaySet: ({ viewports, direction }) => {
      const viewportSpecificData = { ...viewports.viewportSpecificData };
      const activeViewport =
        viewportSpecificData[viewports.activeViewportIndex];
      const studyMetadata = utils.studyMetadataManager.get(
        activeViewport.StudyInstanceUID
      );

      if (!studyMetadata) {
        return;
      }

      const allDisplaySets = studyMetadata.getDisplaySets();
      const currentDisplaySetIndex = allDisplaySets.findIndex(
        displaySet =>
          displaySet.displaySetInstanceUID ===
          activeViewport.displaySetInstanceUID
      );
      if (currentDisplaySetIndex < 0) {
        return;
      }

      const newDisplaySetIndex = currentDisplaySetIndex + direction;
      const newDisplaySetData = allDisplaySets[newDisplaySetIndex];
      if (!newDisplaySetData) {
        return;
      }

      store.dispatch(setActiveViewportSpecificData(newDisplaySetData));
    },
    setToolActiveHotKey: ({ toolName }) => {
      if (!toolName) return;
      store.dispatch(actionSetSelectedTool([{ id: toolName }]));
      cornerstoneTools.setToolActive(toolName, { mouseButtonMask: 1 });
    },
    buttonAction: ({ id }) => {
      const element = document.getElementById(id);
      element.click();
    },
    clearAllAnnotations: measurementsToRemove => {
      if (Array.isArray(measurementsToRemove)) {
        measurementsToRemove.forEach(measurementData => {
          OHIF.measurements.MeasurementHandlers.onRemoved({
            detail: {
              toolType: measurementData.toolType,
              measurementData: measurementData,
            },
          });
        });
      } else {
        Object.keys(measurementsToRemove).map(key => {
          OHIF.measurements.MeasurementHandlers.onRemoved({
            detail: {
              toolType: measurementsToRemove[key].toolType,
              measurementData: measurementsToRemove[key],
            },
          });
        });
      }
    },
    dismissLabelling: () => {
      const { UIDialogService } = servicesManager.services;
      UIDialogService.dismissAll();
    },
  };

  const definitions = {
    setStackScrollActive: {
      commandFn: actions.setToolActiveHotKey,
      storeContexts: ['viewports'],
      options: { toolName: 'StackScroll' },
    },
    setMagnifyActive: {
      commandFn: actions.setToolActiveHotKey,
      storeContexts: ['viewports'],
      options: { toolName: 'Magnify' },
    },
    setLevelsActive: {
      commandFn: actions.setToolActiveHotKey,
      storeContexts: ['viewports'],
      options: { toolName: 'Wwwc' },
    },
    setPanActive: {
      commandFn: actions.setToolActiveHotKey,
      storeContexts: ['viewports'],
      options: { toolName: 'Pan' },
    },
    setLengthActive: {
      commandFn: actions.setToolActiveHotKey,
      storeContexts: ['viewports'],
      options: { toolName: 'Length' },
    },
    setAnnotateActive: {
      commandFn: actions.setToolActiveHotKey,
      storeContexts: ['viewports'],
      options: { toolName: 'ArrowAnnotate' },
    },
    setAngleActive: {
      commandFn: actions.setToolActiveHotKey,
      storeContexts: ['viewports'],
      options: { toolName: 'Angle' },
    },
    setRectangleRoiActive: {
      commandFn: actions.setToolActiveHotKey,
      storeContexts: ['viewports'],
      options: { toolName: 'RectangleRoi' },
    },
    setEllipseActive: {
      commandFn: actions.setToolActiveHotKey,
      storeContexts: ['viewports'],
      options: { toolName: 'EllipticalRoi' },
    },
    setBidirectionalActive: {
      commandFn: actions.setToolActiveHotKey,
      storeContexts: ['viewports'],
      options: { toolName: 'Bidirectional' },
    },
    clearAnnotations: {
      commandFn: actions.setToolActiveHotKey,
      storeContexts: ['viewports'],
      options: { toolName: 'Clear' },
    },
    clickOpenConclusion: {
      commandFn: actions.buttonAction,
      storeContexts: ['viewports'],
      options: { id: 'edit-conclusion-button' },
    },
    clickSave: {
      commandFn: actions.buttonAction,
      storeContexts: ['viewports'],
      options: { id: 'save-button' },
    },
    clickFirstApproval: {
      commandFn: actions.buttonAction,
      storeContexts: ['viewports'],
      options: { id: 'first-approve-button' },
    },
    clickSecondApproval: {
      commandFn: actions.buttonAction,
      storeContexts: ['viewports'],
      options: { id: 'second-approve-button' },
    },
    clickReject: {
      commandFn: actions.buttonAction,
      storeContexts: ['viewports'],
      options: { id: 'reject-button' },
    },
    // Next/Previous active viewport
    incrementActiveViewport: {
      commandFn: actions.updateActiveViewport,
      storeContexts: ['viewports'],
      options: { direction: 1 },
    },
    decrementActiveViewport: {
      commandFn: actions.updateActiveViewport,
      storeContexts: ['viewports'],
      options: { direction: -1 },
    },
    // Window level Presets
    windowLevelPreset0: {
      commandFn: actions.setWindowLevelPreset,
      storeContexts: ['viewports'],
      options: { preset: 0 },
    },
    windowLevelPreset1: {
      commandFn: actions.setWindowLevelPreset,
      storeContexts: ['viewports'],
      options: { preset: 1 },
    },
    windowLevelPreset2: {
      commandFn: actions.setWindowLevelPreset,
      storeContexts: ['viewports'],
      options: { preset: 2 },
    },
    windowLevelPreset3: {
      commandFn: actions.setWindowLevelPreset,
      storeContexts: ['viewports'],
      options: { preset: 3 },
    },
    windowLevelPreset4: {
      commandFn: actions.setWindowLevelPreset,
      storeContexts: ['viewports'],
      options: { preset: 4 },
    },
    windowLevelPreset5: {
      commandFn: actions.setWindowLevelPreset,
      storeContexts: ['viewports'],
      options: { preset: 5 },
    },
    windowLevelPreset6: {
      commandFn: actions.setWindowLevelPreset,
      storeContexts: ['viewports'],
      options: { preset: 6 },
    },
    windowLevelPreset7: {
      commandFn: actions.setWindowLevelPreset,
      storeContexts: ['viewports'],
      options: { preset: 7 },
    },
    windowLevelPreset8: {
      commandFn: actions.setWindowLevelPreset,
      storeContexts: ['viewports'],
      options: { preset: 8 },
    },
    windowLevelPreset9: {
      commandFn: actions.setWindowLevelPreset,
      storeContexts: ['viewports'],
      options: { preset: 9 },
    },
    nextViewportDisplaySet: {
      commandFn: actions.updateViewportDisplaySet,
      storeContexts: ['viewports'],
      options: { direction: 1 },
    },
    previousViewportDisplaySet: {
      commandFn: actions.updateViewportDisplaySet,
      storeContexts: ['viewports'],
      options: { direction: -1 },
    },
    clearAllAnnotations: {
      commandFn: actions.clearAllAnnotations,
      storeContexts: ['viewports'],
      options: {},
    },
    dismissLabelling: {
      commandFn: actions.dismissLabelling,
      storeContexts: [],
      options: {},
    },
  };

  return {
    definitions,
    defaultContext: 'VIEWER',
  };
};

export default commandsModule;
