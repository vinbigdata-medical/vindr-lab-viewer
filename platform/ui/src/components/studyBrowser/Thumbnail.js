import React from 'react';
import PropTypes from 'prop-types';
import { useDrag } from 'react-dnd';
import ImageThumbnail from './ImageThumbnail';
import classNames from 'classnames';

import './Thumbnail.styl';

function ThumbnailFooter({ SeriesNumber, InstanceNumber, numImageFrames }) {
  const getInfo = (value, icon, className = '') => {
    return (
      <div className={classNames('item item-series', className)}>
        <div className="icon">{icon}</div>
        <div className="value">{value}</div>
      </div>
    );
  };
  const getSeriesInformation = (
    SeriesNumber,
    InstanceNumber,
    numImageFrames
  ) => {
    if (!SeriesNumber && !InstanceNumber && !numImageFrames) {
      return;
    }

    return (
      <div className="series-information">
        {getInfo(SeriesNumber, 'S:')}
        {getInfo(InstanceNumber, 'I:')}
        {getInfo(numImageFrames, '', 'image-frames')}
      </div>
    );
  };

  return (
    <div className={classNames('series-details')}>
      {getSeriesInformation(SeriesNumber, InstanceNumber, numImageFrames)}
    </div>
  );
}

function Thumbnail(props) {
  const {
    active,
    altImageText,
    error,
    displaySetInstanceUID,
    imageId,
    imageSrc,
    SeriesDescription,
    stackPercentComplete,
    StudyInstanceUID,
    onClick,
    onDoubleClick,
    onMouseDown,
    supportsDrag,
  } = props;

  const [collectedProps, drag, dragPreview] = useDrag({
    // `droppedItem` in `dropTarget`
    // The only data it will have access to
    item: {
      StudyInstanceUID,
      displaySetInstanceUID,
      type: 'thumbnail', // Has to match `dropTarget`'s type
    },
    canDrag: function(monitor) {
      return supportsDrag;
    },
  });

  const hasImage = imageSrc || imageId;
  const hasAltText = altImageText !== undefined;

  return (
    <div
      ref={drag}
      className={classNames('thumbnail', {
        active_item: active,
      })}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onMouseDown={onMouseDown}
    >
      {SeriesDescription && (
        <div className="series-description">{SeriesDescription || ''}</div>
      )}
      {/* SHOW IMAGE */}
      {hasImage && (
        <ImageThumbnail
          imageSrc={imageSrc}
          imageId={imageId}
          error={error}
          stackPercentComplete={stackPercentComplete}
          width={97}
        />
      )}
      {/* SHOW TEXT ALTERNATIVE */}
      {!hasImage && hasAltText && (
        <div className={'alt-image-text p-x-1'}>
          <h1>{altImageText}</h1>
        </div>
      )}
      {ThumbnailFooter(props)}
    </div>
  );
}

const noop = () => {};

Thumbnail.propTypes = {
  supportsDrag: PropTypes.bool,
  id: PropTypes.string.isRequired,
  displaySetInstanceUID: PropTypes.string.isRequired,
  StudyInstanceUID: PropTypes.string.isRequired,
  imageSrc: PropTypes.string,
  imageId: PropTypes.string,
  error: PropTypes.bool,
  active: PropTypes.bool,
  stackPercentComplete: PropTypes.number,
  /**
  altImageText will be used when no imageId or imageSrc is provided.
It will be displayed inside the <div>. This is useful when it is difficult
  to make a preview for a type of DICOM series (e.g. DICOM-SR)
  */
  altImageText: PropTypes.string,
  SeriesDescription: PropTypes.string,
  SeriesNumber: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  InstanceNumber: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  numImageFrames: PropTypes.number,
  onDoubleClick: PropTypes.func,
  onClick: PropTypes.func,
  onMouseDown: PropTypes.func,
};

Thumbnail.defaultProps = {
  supportsDrag: false,
  active: false,
  error: false,
  stackPercentComplete: 0,
  onDoubleClick: noop,
  onClick: noop,
  onMouseDown: noop,
};

export { Thumbnail };
