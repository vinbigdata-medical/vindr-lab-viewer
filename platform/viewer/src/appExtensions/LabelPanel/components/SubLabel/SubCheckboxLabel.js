import React from 'react';
import { Checkbox, Tooltip } from 'antd';
import PropTypes from 'prop-types';
import { Icon } from '@ohif/ui';

function SubCheckboxLabel(props) {
  const { data = {}, isChecked, handleSelectCheckbox } = props;
  const { sub_labels: subLabels = [], name: title = '', description } = data;

  const [isExpand, setIsExpand] = React.useState(true);

  return (
    <div className="sub-label">
      <div className="title" onClick={() => setIsExpand(!isExpand)}>
        <Icon
          className="collapse-icon"
          name={isExpand ? 'minus' : 'plus-sign'}
          theme="filled"
        />
        <span className={'title-text'}>
          <Tooltip title={description || ''} placement="topLeft">
            {title}
          </Tooltip>
        </span>
      </div>
      {isExpand && (
        <div className={'radio-list'}>
          {subLabels.map(sub => (
            <Checkbox
              value={sub.id}
              checked={isChecked(sub)}
              className={'radio'}
              key={sub.id}
              onChange={e => handleSelectCheckbox(e.target.checked, sub)}
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

SubCheckboxLabel.propTypes = {
  data: PropTypes.object,
  isChecked: PropTypes.func,
  handleSelectCheckbox: PropTypes.func,
};

export default React.memo(SubCheckboxLabel);
