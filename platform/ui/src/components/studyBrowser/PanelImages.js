import React from 'react';
import ImageThumbnail from './ImageThumbnail';
import classNames from 'classnames';

import './Thumbnail.styl';

function PanelImages(props) {
  const {
    active,
    error,
    imageId,
    imageSrc,
    onClick,
    onDoubleClick,
    onMouseDown,
  } = props;

  const hasImage = imageSrc || imageId;

  return (
    <div
      className={classNames('thumbnail', { active_item: active })}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onMouseDown={onMouseDown}
    >
      {/* SHOW IMAGE */}
      {hasImage && (
        <ImageThumbnail
          imageSrc={imageSrc}
          imageId={imageId}
          error={error}
          width={97}
        />
      )}
    </div>
  );
}

const noop = () => {};

PanelImages.defaultProps = {
  active: false,
  error: false,
  onDoubleClick: noop,
  onClick: noop,
  onMouseDown: noop,
};

export default React.memo(PanelImages, (preProps, nextProps) => {
  return (
    preProps.imageId === nextProps.imageId &&
    preProps.imageSrc === nextProps.imageSrc &&
    preProps.active === nextProps.active &&
    preProps.error === nextProps.error
  );
});
