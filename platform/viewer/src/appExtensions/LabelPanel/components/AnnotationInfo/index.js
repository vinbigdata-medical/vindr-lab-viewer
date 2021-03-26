import React, { memo } from 'react';
import { Avatar } from 'antd';
import { isDiff } from '../../../../utils/helpers';
import './AnnotationInfo.css';

const AnnotationInfo = props => {
  const { measurementData = {} } = props;
  const { userInfor = {} } = measurementData;
  return (
    <div className="annotation-info">
      <ul className="label-list">
        {(measurementData.locationLabel || []).map((lb, idx) => (
          <li className="lb-item" key={idx}>
            {`${lb}`}
          </li>
        ))}
      </ul>
      <div className="author-info">
        {userInfor.username || ''}
        {userInfor.avatar && (
          <Avatar className="ic-avatar" size="small" icon="user" />
        )}
      </div>
    </div>
  );
};

export default memo(AnnotationInfo, (prevProps, nextProps) => {
  return !isDiff(prevProps.measurementData, nextProps.measurementData);
});
