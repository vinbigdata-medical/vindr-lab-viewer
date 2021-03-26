import cornerstone from 'cornerstone-core';
import cornerstoneTools from 'vindr-tools';
import setMPRLayout from './utils/setMPRLayout.js';
import get from 'lodash/get';
import { actionSetExtensionData } from '@ohif/viewer/src/system/systemAction';
import { activeCrosshearTool } from '@ohif/viewer/src/utils/helpers';

const commandsModule = ({ commandsManager }) => {
  // TODO: Put this somewhere else

  function getMprEnabledElements() {
    return (cornerstone.getEnabledElements() || []).map(elm => elm.element);
  }

  const actions = {
    getVtkApis: ({ index }) => {
      // TO DO
    },
    requestNewSegmentation: async ({ viewports }) => {
      // TO DO
    },
    jumpToSlice: async ({
      viewports,
      studies,
      StudyInstanceUID,
      displaySetInstanceUID,
      SOPClassUID,
      SOPInstanceUID,
      segmentNumber,
      frameIndex,
      frame,
      done = () => {},
    }) => {
      // TO DO
    },
    setSegmentationConfiguration: async ({
      viewports,
      globalOpacity,
      visible,
      renderOutline,
      outlineThickness,
    }) => {
      // TO DO
    },
    setSegmentConfiguration: async ({ viewports, visible, segmentNumber }) => {
      // TO DO
    },

    enableCrosshairsTool: () => {
      activeCrosshearTool();
      const storeState = window.store.getState();
      const viewMode = get(storeState, 'extensions.viewMode') || {};
      window.store.dispatch(
        actionSetExtensionData('viewMode', {
          ...viewMode,
          activeTool: false,
        })
      );
    },

    mpr2d: async ({ viewports }) => {
      window.store.dispatch(
        actionSetExtensionData('viewMode', {
          mpr: true,
          editing: false,
          activeTool: false,
        })
      );

      const displaySet =
        viewports.viewportSpecificData[viewports.activeViewportIndex];

      const viewportProps = [
        {
          //Axial
          orientation: {
            sliceNormal: [0, 0, 1],
            viewUp: [0, -1, 0],
          },
        },
        {
          // Sagittal
          orientation: {
            sliceNormal: [1, 0, 0],
            viewUp: [0, 0, 1],
          },
        },
        {
          // Coronal
          orientation: {
            sliceNormal: [0, 1, 0],
            viewUp: [0, 0, 1],
          },
        },
      ];

      try {
        await setMPRLayout(displaySet, viewportProps, 1, 3);
      } catch (error) {
        throw new Error(error);
      }
    },
    setWindowLevelPreset: async ({ preferences, preset }) => {
      if (Number(preset) === 0) {
        commandsManager.runCommand('resetViewport');
      } else {
        if (!preferences) return;
        const { window, level } =
          preferences.windowLevelData && preferences.windowLevelData[preset];

        (getMprEnabledElements() || []).forEach(enabledElement => {
          let viewport = cornerstone.getViewport(enabledElement);
          viewport.voi = {
            windowWidth: Number(window),
            windowCenter: Number(level),
          };
          cornerstone.setViewport(enabledElement, viewport);
        });
      }
    },
    resetViewport: () => {
      (getMprEnabledElements() || []).forEach(enabledElement => {
        cornerstone.reset(enabledElement);
      });
    },
    invertViewport: () => {
      (getMprEnabledElements() || []).forEach(enabledElement => {
        let viewport = cornerstone.getViewport(enabledElement);
        viewport.invert = !viewport.invert;
        cornerstone.setViewport(enabledElement, viewport);
      });
    },
    setToolActive: ({ toolName }) => {
      if (!toolName) {
        console.warn('No toolname provided to setToolActive command');
      }
      cornerstoneTools.setToolActive(toolName, { mouseButtonMask: 1 });
    },
    setToolActiveHotKey: ({ toolName }) => {
      //TODO: implement for hotkeys
    },
  };

  window.vtkActions = actions;

  const definitions = {
    requestNewSegmentation: {
      commandFn: actions.requestNewSegmentation,
      storeContexts: ['viewports'],
      options: {},
    },
    jumpToSlice: {
      commandFn: actions.jumpToSlice,
      storeContexts: ['viewports'],
      options: {},
    },
    setSegmentationConfiguration: {
      commandFn: actions.setSegmentationConfiguration,
      storeContexts: ['viewports'],
      options: {},
    },
    setSegmentConfiguration: {
      commandFn: actions.setSegmentConfiguration,
      storeContexts: ['viewports'],
      options: {},
    },
    enableCrosshairsTool: {
      commandFn: actions.enableCrosshairsTool,
      options: {},
    },
    mpr2d: {
      commandFn: actions.mpr2d,
      storeContexts: ['viewports'],
      options: {},
      context: 'VIEWER',
    },
    getVtkApiForViewportIndex: {
      commandFn: actions.getVtkApis,
      context: 'VIEWER',
    },
    setRectangleRoiActive: {
      commandFn: actions.setToolActiveHotKey,
      storeContexts: [],
      options: { toolName: 'RectangleRoi' },
    },
    invertViewport: {
      commandFn: actions.invertViewport,
      storeContexts: [],
      options: {},
    },
    setToolActive: {
      commandFn: actions.setToolActive,
      storeContexts: [],
      options: {},
    },
    setZoomTool: {
      commandFn: actions.setToolActive,
      storeContexts: [],
      options: { toolName: 'Zoom' },
    },
    resetViewport: {
      commandFn: actions.resetViewport,
      options: {},
    },
    windowLevelPreset0: {
      commandFn: actions.setWindowLevelPreset,
      storeContexts: ['preferences'],
      options: { preset: 0 },
    },
    windowLevelPreset1: {
      commandFn: actions.setWindowLevelPreset,
      storeContexts: ['preferences'],
      options: { preset: 1 },
    },
    windowLevelPreset2: {
      commandFn: actions.setWindowLevelPreset,
      storeContexts: ['preferences'],
      options: { preset: 2 },
    },
    windowLevelPreset3: {
      commandFn: actions.setWindowLevelPreset,
      storeContexts: ['preferences'],
      options: { preset: 3 },
    },
    windowLevelPreset4: {
      commandFn: actions.setWindowLevelPreset,
      storeContexts: ['preferences'],
      options: { preset: 4 },
    },
    windowLevelPreset5: {
      commandFn: actions.setWindowLevelPreset,
      storeContexts: ['preferences'],
      options: { preset: 5 },
    },
    windowLevelPreset6: {
      commandFn: actions.setWindowLevelPreset,
      storeContexts: ['preferences'],
      options: { preset: 6 },
    },
    windowLevelPreset7: {
      commandFn: actions.setWindowLevelPreset,
      storeContexts: ['preferences'],
      options: { preset: 7 },
    },
    windowLevelPreset8: {
      commandFn: actions.setWindowLevelPreset,
      storeContexts: ['preferences'],
      options: { preset: 8 },
    },
    windowLevelPreset9: {
      commandFn: actions.setWindowLevelPreset,
      storeContexts: ['preferences'],
      options: { preset: 9 },
    },
  };

  return {
    definitions,
    defaultContext: 'ACTIVE_VIEWPORT::VTK',
  };
};

export default commandsModule;
