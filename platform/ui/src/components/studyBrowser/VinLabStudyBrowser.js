import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Thumbnail } from './Thumbnail.js';
import PanelImages from './PanelImages.js';
import LeftNavigation from './LeftNavigation';
import { commandsManager } from '@ohif/viewer/src/App';
import './StudyBrowser.styl';

const NAV_TYPE = {
  STUDY: 'STUDY',
  SERIES: 'SERIES',
  IMAGE: 'IMAGE',
};

const COLLAPSE_SIDE_LEFT_MAX_WIDTH = '102px';
const EXPANSE_SIDE_LEFT_MAX_WIDTH = '222px';

function VinLabStudyBrowser(props) {
  const {
    studies,
    onThumbnailClick,
    onThumbnailDoubleClick,
    supportsDrag,
    displaySetInstanceUIDSelected,
    SOPInstanceUIDSelected,
    activeViewportData,
    session,
    displaySetData,
    onImageClick,
    onChangeStudy,
    viewMode,
  } = props;

  const [selectedNav, setSelectedNav] = useState({});

  useEffect(() => {
    setSelectedNav({ key: NAV_TYPE.SERIES });
  }, []);

  const exitMprViewport = () => {
    if (viewMode.mpr) {
      commandsManager.runCommand('setCornerstoneLayout');
    }
  };

  const handleChangeStudy = data => {
    exitMprViewport();
    onChangeStudy(data);
  };

  const handleChangeSeries = data => {
    exitMprViewport();
    onThumbnailClick(data);
  };

  const handleChangeImage = data => {
    exitMprViewport();
    onImageClick(data);
  };

  const handleOpenPanel = (isOpen, nav = {}) => {
    setSelectedNav(nav);
    const elmLeftPanel = document.getElementById('jsLeftPanel');
    const elmSideLeftPanel = document.querySelector('.sidepanel.from-left');
    if (isOpen) {
      elmLeftPanel.style.transform = 'none';
      elmSideLeftPanel.style.maxWidth = EXPANSE_SIDE_LEFT_MAX_WIDTH;
    } else {
      elmLeftPanel.style.transform = 'translateX(-200%)';
      elmSideLeftPanel.style.maxWidth = COLLAPSE_SIDE_LEFT_MAX_WIDTH;
    }
  };

  const StudyList = useCallback(
    () => (
      <div className="study-list">
        {(session.data || []).map((it, idx) => (
          <div
            className={`study-item ${
              it.meta.study_code === session.currentStudy.meta.study_code
                ? 'active-item'
                : ''
            }`}
            key={it.meta.study_code}
            onClick={() => {
              if (session.studyIndex === idx) return;
              handleChangeStudy({
                ...session,
                studyIndex: idx,
                currentStudy: session.data[idx],
              });
            }}
          >
            {it.meta && it.meta.study_code}
          </div>
        ))}
      </div>
    ),
    [session]
  );

  const ImageList = useCallback(() => {
    if (!displaySetData) return null;
    return (displaySetData.images || []).map((it, idx) => (
      <div key={idx} className="thumbnail-container" data-cy="thumbnail-list">
        <PanelImages
          key={idx}
          id={idx + '_id'}
          imageId={it.getImageId() || null}
          onClick={() =>
            handleChangeImage({
              ...displaySetData,
              SOPInstanceUID: it.SOPInstanceUID,
              frameIndex: idx,
            })
          }
          active={SOPInstanceUIDSelected === it.SOPInstanceUID}
        />
      </div>
    ));
  }, [displaySetData, SOPInstanceUIDSelected]);

  return (
    <div className="study-browser">
      <div className="nav-container">
        <LeftNavigation
          onOpenPanel={handleOpenPanel}
          studies={studies}
          displaySetData={displaySetData}
          activeViewportData={activeViewportData}
          onChangeSeries={handleChangeSeries}
          onChangeImage={handleChangeImage}
          session={session}
          onChangeStudy={handleChangeStudy}
          selectedNav={selectedNav}
        />
      </div>
      <div id="jsLeftPanel" className="scrollable-study-thumbnails">
        {selectedNav.key === NAV_TYPE.STUDY && <StudyList />}
        {selectedNav.key === NAV_TYPE.SERIES &&
          studies
            .map((study, studyIndex) => {
              const { StudyInstanceUID } = study;
              return study.thumbnails.map((thumb, thumbIndex) => {
                // TODO: Thumb has more props than we care about?
                const {
                  altImageText,
                  displaySetInstanceUID,
                  imageId,
                  InstanceNumber,
                  numImageFrames,
                  SeriesDescription,
                  SeriesNumber,
                  stackPercentComplete,
                } = thumb;

                return (
                  <div
                    key={thumb.displaySetInstanceUID}
                    className="thumbnail-container"
                    data-cy="thumbnail-list"
                  >
                    <Thumbnail
                      supportsDrag={supportsDrag}
                      key={`${studyIndex}_${thumbIndex}`}
                      id={`${studyIndex}_${thumbIndex}`} // Unused?
                      // Study
                      StudyInstanceUID={StudyInstanceUID} // used by drop
                      // Thumb
                      altImageText={altImageText}
                      imageId={imageId}
                      InstanceNumber={InstanceNumber}
                      displaySetInstanceUID={displaySetInstanceUID} // used by drop
                      numImageFrames={numImageFrames}
                      SeriesDescription={SeriesDescription}
                      SeriesNumber={SeriesNumber}
                      stackPercentComplete={stackPercentComplete}
                      // Events
                      onClick={() => handleChangeSeries(displaySetInstanceUID)}
                      onDoubleClick={onThumbnailDoubleClick}
                      active={
                        displaySetInstanceUIDSelected === displaySetInstanceUID
                      }
                    />
                  </div>
                );
              });
            })
            .flat()}

        {selectedNav.key === NAV_TYPE.IMAGE &&
          displaySetData &&
          displaySetData.images &&
          ImageList()}
      </div>
    </div>
  );
}

const noop = () => {};

VinLabStudyBrowser.propTypes = {
  studies: PropTypes.arrayOf(
    PropTypes.shape({
      StudyInstanceUID: PropTypes.string.isRequired,
      thumbnails: PropTypes.arrayOf(
        PropTypes.shape({
          altImageText: PropTypes.string,
          displaySetInstanceUID: PropTypes.string.isRequired,
          imageId: PropTypes.string,
          InstanceNumber: PropTypes.number,
          numImageFrames: PropTypes.number,
          SeriesDescription: PropTypes.string,
          SeriesNumber: PropTypes.number,
          stackPercentComplete: PropTypes.number,
        })
      ),
    })
  ).isRequired,
  supportsDrag: PropTypes.bool,
  onThumbnailClick: PropTypes.func,
  onThumbnailDoubleClick: PropTypes.func,
  displaySetInstanceUIDSelected: PropTypes.string,
  SOPInstanceUIDSelected: PropTypes.string,
  displaySetData: PropTypes.any,
  onImageClick: PropTypes.func,
  onChangeStudy: PropTypes.func,
};

VinLabStudyBrowser.defaultProps = {
  studies: [],
  supportsDrag: true,
  onThumbnailClick: noop,
  onThumbnailDoubleClick: noop,
  onImageClick: noop,
  onChangeStudy: noop,
};

export { VinLabStudyBrowser };
