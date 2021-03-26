import OHIF from '@ohif/core';
import { connect } from 'react-redux';
import { VinLabStudyBrowser } from '@ohif/ui';
import cloneDeep from 'lodash.clonedeep';
import { isEmpty } from 'lodash';
import findDisplaySetByUID from './VinLabFindDisplaySetByUID';
import { actionSetExtensionData } from '../system/systemAction';

const { studyMetadataManager } = OHIF.utils;

const { setActiveViewportSpecificData } = OHIF.redux.actions;

const getDisplaySet = (studyMetadata, displaySetInstanceUID) => {
  let displaySet = findDisplaySetByUID(studyMetadata, displaySetInstanceUID);

  if (!isEmpty(displaySet) && displaySet.isDerived) {
    const { Modality } = displaySet;

    displaySet = displaySet.getSourceDisplaySet(studyMetadata);
    if (!displaySet) {
      throw new Error(`Referenced series for ${Modality} dataset not present.`);
    }

    if (!displaySet) {
      throw new Error('Source data not present');
    }
  }
  return displaySet;
};

// TODO
// - Determine in which display set is active from Redux (activeViewportIndex and layout viewportData)
// - Pass in errors and stack loading progress from Redux
const mapStateToProps = (state, ownProps) => {
  // If we know that the stack loading progress details have changed,
  // we can try to update the component state so that the thumbnail
  // progress bar is updated
  const { viewports = {}, extensions = {} } = state || {};
  const { session = {}, viewMode = {} } = extensions;
  const { activeViewportIndex = 0, viewportSpecificData = {} } = viewports;
  const activeViewportData = viewportSpecificData[activeViewportIndex] || {};
  const { displaySetInstanceUID, SOPInstanceUID } = activeViewportData || {};

  let displaySet = getDisplaySet(ownProps.studyMetadata, displaySetInstanceUID);

  const stackLoadingProgressMap = state.loading.progress;
  const studiesWithLoadingData = cloneDeep(ownProps.studies);

  studiesWithLoadingData.forEach(study => {
    study.thumbnails.forEach(data => {
      const { displaySetInstanceUID } = data;
      const stackId = `StackProgress:${displaySetInstanceUID}`;
      const stackProgressData = stackLoadingProgressMap[stackId];

      let stackPercentComplete = 0;
      if (stackProgressData) {
        stackPercentComplete = stackProgressData.percentComplete;
      }

      data.stackPercentComplete = stackPercentComplete;
    });
  });

  return {
    studies: studiesWithLoadingData,
    displaySetInstanceUIDSelected: displaySetInstanceUID,
    SOPInstanceUIDSelected: SOPInstanceUID,
    displaySetData: displaySet,
    activeViewportData: activeViewportData,
    session: session,
    viewMode,
  };
};

const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    onThumbnailClick: displaySetInstanceUID => {
      let displaySet = getDisplaySet(
        ownProps.studyMetadata,
        displaySetInstanceUID
      );

      dispatch(setActiveViewportSpecificData(displaySet));
    },
    onImageClick: displaySet => {
      dispatch(setActiveViewportSpecificData(displaySet));
    },
    onChangeStudy: (session = {}) => {
      dispatch(actionSetExtensionData('session', session));
    },
  };
};

const ConnectedStudyBrowser = connect(
  mapStateToProps,
  mapDispatchToProps
)(VinLabStudyBrowser);

export default ConnectedStudyBrowser;
