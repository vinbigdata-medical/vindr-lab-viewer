import React from 'react';
import { Checkbox, Tooltip } from 'antd';
import PropTypes from 'prop-types';
import { Icon } from '@ohif/ui';

import './checkboxSubLabel.styl';

function SubLabel(props) {
  const {
    data = {},
    isChecked,
    handleSelectCheckbox,
    defaultExpand = false,
  } = props;
  const { sub_labels: subLabels = [], name: title = '' } = data;

  const [isExpand, setIsExpand] = React.useState(defaultExpand);

  return (
    <div className="sub-label">
      <div className="title" onClick={() => setIsExpand(!isExpand)}>
        <Icon
          className="collapse-icon"
          name={isExpand ? 'minus' : 'plus-sign'}
          theme="filled"
        />
        <span className={'title-text'}>{title}</span>
      </div>
      {isExpand && (
        <div className={'radio-list'}>
          {subLabels.map(sub => (
            <Checkbox
              value={sub.id}
              checked={isChecked(sub)}
              className={'radio'}
              key={sub.id}
              onChange={event => handleSelectCheckbox(event, sub)}
            >
              <Tooltip title={sub.description || ''} placement="topLeft">
                {sub.name}
              </Tooltip>
            </Checkbox>
          ))}
        </div>
      )}
    </div>
  );
}

SubLabel.propTypes = {
  data: PropTypes.object,
  isChecked: PropTypes.func,
  handleSelectCheckbox: PropTypes.func,
  defaultExpand: PropTypes.bool,
};

export const CheckboxSubLabel = React.memo(SubLabel);
