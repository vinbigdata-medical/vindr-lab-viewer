import React, { Component } from 'react';
import { getImageData, loadImageData } from 'vindr-vtkjs-viewport';
import ConnectedVTKViewport from './ConnectedVTKViewport';
import LoadingIndicator from './LoadingIndicator.js';
import OHIF from '@ohif/core';
import PropTypes from 'prop-types';
import cornerstone from 'cornerstone-core';

const { StackManager } = OHIF.utils;

class OHIFVTKViewport extends Component {
  state = {
    percentComplete: 0,
    isLoaded: false,
  };

  static propTypes = {
    viewportData: PropTypes.shape({
      studies: PropTypes.array.isRequired,
      displaySet: PropTypes.shape({
        StudyInstanceUID: PropTypes.string.isRequired,
        displaySetInstanceUID: PropTypes.string.isRequired,
        sopClassUIDs: PropTypes.arrayOf(PropTypes.string),
        SOPInstanceUID: PropTypes.string,
        frameIndex: PropTypes.number,
      }),
    }),
    viewportIndex: PropTypes.number.isRequired,
    children: PropTypes.node,
    servicesManager: PropTypes.object.isRequired,
  };

  static id = 'OHIFVTKViewport';

  static init() {
    console.log('OHIFVTKViewport init()');
  }

  static destroy() {
    console.log('OHIFVTKViewport destroy()');
    StackManager.clearStacks();
  }

  static getCornerstoneStack(
    studies,
    StudyInstanceUID,
    displaySetInstanceUID,
    SOPInstanceUID,
    frameIndex
  ) {
    // Create shortcut to displaySet
    const study = studies.find(
      study => study.StudyInstanceUID === StudyInstanceUID
    );

    const displaySet = study.displaySets.find(set => {
      return set.displaySetInstanceUID === displaySetInstanceUID;
    });

    // Get stack from Stack Manager
    const storedStack = StackManager.findOrCreateStack(study, displaySet);

    // Clone the stack here so we don't mutate it
    const stack = Object.assign({}, storedStack);

    if (frameIndex !== undefined) {
      stack.currentImageIdIndex = frameIndex;
    } else if (SOPInstanceUID) {
      const index = stack.imageIds.findIndex(imageId => {
        const imageIdSOPInstanceUID = cornerstone.metaData.get(
          'SOPInstanceUID',
          imageId
        );

        return imageIdSOPInstanceUID === SOPInstanceUID;
      });

      if (index > -1) {
        stack.currentImageIdIndex = index;
      }
    } else {
      stack.currentImageIdIndex = 0;
    }

    return stack;
  }

  getViewportData = (
    studies,
    StudyInstanceUID,
    displaySetInstanceUID,
    SOPClassUID,
    SOPInstanceUID,
    frameIndex
  ) => {
    const stack = OHIFVTKViewport.getCornerstoneStack(
      studies,
      StudyInstanceUID,
      displaySetInstanceUID,
      SOPClassUID,
      SOPInstanceUID,
      frameIndex
    );

    const imageDataObject = getImageData(stack.imageIds, displaySetInstanceUID);

    return {
      imageDataObject,
      stack,
    };
  };

  setStateFromProps() {
    const { studies, displaySet } = this.props.viewportData;
    const {
      StudyInstanceUID,
      displaySetInstanceUID,
      sopClassUIDs,
      SOPInstanceUID,
      frameIndex,
      SeriesInstanceUID,
    } = displaySet;

    if (sopClassUIDs.length > 1) {
      console.warn(
        'More than one SOPClassUID in the same series is not yet supported.'
      );
    }

    const study = studies.find(
      study => study.StudyInstanceUID === StudyInstanceUID
    );

    const dataDetails = {
      studyDate: study.studyDate,
      studyTime: study.studyTime,
      studyDescription: study.studyDescription,
      patientName: study.patientName,
      patientId: study.patientId,
      seriesNumber: String(displaySet.seriesNumber),
      seriesDescription: displaySet.seriesDescription,
    };

    const { imageDataObject, stack } = this.getViewportData(
      studies,
      StudyInstanceUID,
      displaySetInstanceUID,
      SOPInstanceUID,
      frameIndex
    );

    this.imageDataObject = imageDataObject;

    this.setState(
      {
        percentComplete: 0,
        dataDetails,
      },
      () => {
        this.loadProgressively(imageDataObject);
        setTimeout(() => {
          this.setState({
            stack,
            imageDataObject,
            StudyInstanceUID,
            SeriesInstanceUID,
          });
        }, 200);
      }
    );
  }

  componentDidMount() {
    this.setStateFromProps();
  }

  componentDidUpdate(prevProps, prevState) {
    const { displaySet } = this.props.viewportData;
    const prevDisplaySet = prevProps.viewportData.displaySet;

    if (
      displaySet.displaySetInstanceUID !==
        prevDisplaySet.displaySetInstanceUID ||
      displaySet.SOPInstanceUID !== prevDisplaySet.SOPInstanceUID ||
      displaySet.frameIndex !== prevDisplaySet.frameIndex
    ) {
      this.setStateFromProps();
    }
  }

  loadProgressively(imageDataObject) {
    loadImageData(imageDataObject);

    const { isLoading, imageIds } = imageDataObject;

    if (!isLoading) {
      this.setState({ isLoaded: true });
      return;
    }

    const NumberOfFrames = imageIds.length;

    const onPixelDataInsertedCallback = numberProcessed => {
      const percentComplete = Math.floor(
        (numberProcessed * 100) / NumberOfFrames
      );

      if (percentComplete !== this.state.percentComplete) {
        this.setState({
          percentComplete,
        });
      }
    };

    const onPixelDataInsertedErrorCallback = error => {
      const { UINotificationService } = this.props.servicesManager.services;

      if (!this.hasError) {
        if (this.props.viewportIndex === 0) {
          // Only show the notification from one viewport 1 in MPR2D.
          UINotificationService.show({
            title: 'MPR Load Error',
            message: error.message,
            type: 'error',
            autoClose: false,
          });
        }

        this.hasError = true;
      }
    };

    const onAllPixelDataInsertedCallback = () => {
      this.setState({
        isLoaded: true,
      });
    };

    imageDataObject.onPixelDataInserted(onPixelDataInsertedCallback);
    imageDataObject.onAllPixelDataInserted(onAllPixelDataInsertedCallback);
    imageDataObject.onPixelDataInsertedError(onPixelDataInsertedErrorCallback);
  }

  render() {
    let childrenWithProps = null;

    // TODO: Does it make more sense to use Context?
    if (this.props.children && this.props.children.length) {
      childrenWithProps = this.props.children.map((child, index) => {
        return (
          child &&
          React.cloneElement(child, {
            viewportIndex: this.props.viewportIndex,
            key: index,
          })
        );
      });
    }

    const style = { width: '100%', height: '100%', position: 'relative' };

    return (
      <>
        <div className="vtk-viewport-content" style={style}>
          {!this.state.isLoaded && (
            <LoadingIndicator percentComplete={this.state.percentComplete} />
          )}
          {this.state.imageDataObject && (
            <ConnectedVTKViewport
              stack={this.state.stack}
              imageDataObject={this.state.imageDataObject}
              viewportIndex={this.props.viewportIndex}
              dataDetails={this.state.dataDetails}
              studyInstanceUID={this.state.StudyInstanceUID}
              seriesInstanceUID={this.state.SeriesInstanceUID}
            />
          )}
        </div>
        {childrenWithProps}
      </>
    );
  }
}

export default OHIFVTKViewport;
