import OHIF from '@ohif/core';
import cornerstone from 'cornerstone-core';
import cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader';
import dicomParser from 'dicom-parser';
import version from './version.js';
import AppContext from './context/AppContext';

export function setConfiguration(appConfig) {
  let homepage;
  const { process } = window;
  if (process && process.env && process.env.PUBLIC_URL) {
    homepage = process.env.PUBLIC_URL;
  }

  window.info = {
    version,
    homepage,
  };

  // For debugging
  //if (process.env.node_env === 'development') {
  window.cornerstone = cornerstone;
  window.cornerstoneWADOImageLoader = cornerstoneWADOImageLoader;
  //}

  cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
  cornerstoneWADOImageLoader.external.dicomParser = dicomParser;

  OHIF.user.getAccessToken = () => {
    // TODO: Get the Redux store from somewhere else
    const state = window.store.getState();
    if (!state.oidc || !state.oidc.user) {
      return;
    }

    return state.oidc.user.access_token;
  };

  OHIF.errorHandler.getHTTPErrorHandler = () => {
    // const { appConfig = {} } = AppContext;

    return appConfig.httpErrorHandler;
  };

  cornerstoneWADOImageLoader.configure({
    beforeSend: function(xhr) {
      const headers = OHIF.DICOMWeb.getAuthorizationHeader();

      if (headers.Authorization) {
        xhr.setRequestHeader('Authorization', headers.Authorization);
      }
    },
    errorInterceptor: error => {
      // const { appConfig = {} } = AppContext;

      if (typeof appConfig.httpErrorHandler === 'function') {
        appConfig.httpErrorHandler(error);
      }
    },
  });
}

window.config = {
  // default: '/'
  routerBasename: '/medical-view',
  extensions: [],
  showStudyList: true,
  filterQueryParam: false,
  servers: {
    // Please notes: local and dev using vindoc-dev, staging using vindoc-api
    dicomWeb: [
      {
        name: 'DCM4CHEE',
        wadoUriRoot: process.env.SERVER_BASE_URL + '/dicomweb/wado',
        qidoRoot: process.env.SERVER_BASE_URL + '/dicomweb/dicom-web',
        wadoRoot: process.env.SERVER_BASE_URL + '/dicomweb/dicom-web',
        qidoSupportsIncludeField: true,
        imageRendering: 'wadors',
        thumbnailRendering: 'wadors',
        enableStudyLazyLoad: true,
        supportsFuzzyMatching: true,
      },
    ],
  },
  // Extensions should be able to suggest default values for these?
  // Or we can require that these be explicitly set
  hotkeys: [
    // Supported Keys: https://craig.is/killing/mice
    // ~ Cornerstone Extension
    { commandName: 'setStackScrollActive', label: 'Stack Scroll', keys: ['s'] },
    { commandName: 'setZoomTool', label: 'Zoom', keys: ['z'] },
    { commandName: 'scaleUpViewport', label: 'Zoom In', keys: ['+'] },
    { commandName: 'scaleDownViewport', label: 'Zoom Out', keys: ['-'] },
    { commandName: 'fitViewportToWindow', label: 'Zoom to Fit', keys: ['='] },
    { commandName: 'setMagnifyActive', label: 'Magnify', keys: ['m'] },
    { commandName: 'setLevelsActive', label: 'Levels', keys: ['w'] },
    { commandName: 'setAngleActive', label: 'Angle', keys: ['a'] },
    {
      commandName: 'setBidirectionalActive',
      label: 'Bidirectional',
      keys: ['b'],
    },
    { commandName: 'setEllipseActive', label: 'Ellipse', keys: ['e'] },
    {
      commandName: 'setRectangleRoiActive',
      label: 'Rectangle',
      keys: ['r'],
    },
    { commandName: 'setPanActive', label: 'Pan', keys: ['p'] },

    { commandName: 'invertViewport', label: 'Invert', keys: ['i'] },
    {
      commandName: 'flipViewportVertical',
      label: 'Flip Horizontally',
      keys: ['h'],
    },
    {
      commandName: 'flipViewportHorizontal',
      label: 'Flip Vertically',
      keys: ['v'],
    },
    {
      commandName: 'clearAnnotations',
      label: 'Clear Annotations',
      keys: ['del'],
    },
    { commandName: 'resetViewport', label: 'Reset', keys: ['space'] },
    {
      commandName: 'clickOpenConclusion',
      label: 'Conclusion',
      keys: ['alt', 'c'],
    },
    { commandName: 'clickSave', label: 'Save', keys: ['alt', 's'] },
    {
      commandName: 'clickFirstApproval',
      label: 'First Approval',
      keys: ['alt', 'a'],
    },
    {
      commandName: 'clickSecondApproval',
      label: 'Second Approval',
      keys: ['alt', 'd'],
    },
    {
      commandName: 'clickReject',
      label: 'Reject',
      keys: ['alt', 'r'],
    },

    {
      commandName: 'rotateViewportCW',
      label: 'Rotate Right',
      keys: ['alt', 'right'],
    },
    {
      commandName: 'rotateViewportCCW',
      label: 'Rotate Left',
      keys: ['alt', 'left'],
    },

    { commandName: 'nextImage', label: 'Next Image', keys: ['down'] },
    { commandName: 'previousImage', label: 'Previous Image', keys: ['up'] },
    // ~ Cornerstone Tools
    // firstImage
    // lastImage
    {
      commandName: 'previousViewportDisplaySet',
      label: 'Previous Series',
      keys: ['pagedown'],
    },
    {
      commandName: 'nextViewportDisplaySet',
      label: 'Next Series',
      keys: ['pageup'],
    },
    // ~ Window level presets
    {
      commandName: 'windowLevelPreset0',
      label: 'W/L Preset 0',
      keys: ['0'],
    },
    {
      commandName: 'windowLevelPreset1',
      label: 'W/L Preset 1',
      keys: ['1'],
    },
    {
      commandName: 'windowLevelPreset2',
      label: 'W/L Preset 2',
      keys: ['2'],
    },
    {
      commandName: 'windowLevelPreset3',
      label: 'W/L Preset 3',
      keys: ['3'],
    },
    {
      commandName: 'windowLevelPreset4',
      label: 'W/L Preset 4',
      keys: ['4'],
    },
    {
      commandName: 'windowLevelPreset5',
      label: 'W/L Preset 5',
      keys: ['5'],
    },
    {
      commandName: 'windowLevelPreset6',
      label: 'W/L Preset 6',
      keys: ['6'],
    },
    {
      commandName: 'windowLevelPreset7',
      label: 'W/L Preset 7',
      keys: ['7'],
    },
    {
      commandName: 'windowLevelPreset8',
      label: 'W/L Preset 8',
      keys: ['8'],
    },
    {
      commandName: 'windowLevelPreset9',
      label: 'W/L Preset 9',
      keys: ['9'],
    },
    // ~ Global
    {
      commandName: 'incrementActiveViewport',
      label: 'Next Viewport',
      keys: ['right'],
    },
    {
      commandName: 'decrementActiveViewport',
      label: 'Previous Viewport',
      keys: ['left'],
    },
    {
      commandName: 'dismissLabelling',
      label: 'Dismiss labelling popup',
      keys: ['esc'],
    },
  ],
  cornerstoneExtensionConfig: {
    tools: {
      RectangleRoi: {
        configuration: {
          fillBackground: true,
          renderDashedOnActive: true,
          distance: 2,
          triggerHover: true,
        },
      },
      FreehandRoi: {
        configuration: {
          fillBackground: true,
          triggerHover: true,
        },
      },
    },
  },
  // Following property limits number of simultaneous series metadata requests.
  // For http/1.x-only servers, set this to 5 or less to improve
  //  on first meaningful display in viewer
  // If the server is particularly slow to respond to series metadata
  //  requests as it extracts the metadata from raw files everytime,
  //  try setting this to even lower value
  // Leave it undefined for no limit, sutiable for HTTP/2 enabled servers
  // maxConcurrentMetadataRequests: 5,
};
