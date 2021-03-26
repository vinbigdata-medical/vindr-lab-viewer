import './VinLabToolbarButton.styl';

import { Icon } from './../elements/Icon';
import PropTypes from 'prop-types';
import React from 'react';
import classnames from 'classnames';
import { Tooltip } from 'antd';

import { withTranslation } from '../contextProviders';
import { disableTools } from '@ohif/viewer/src/utils/helpers';

export function ToolbarButton(props) {
  const { isActive, icon, labelWhenActive, onClick, t } = props;
  const className = classnames(
    props.className,
    { active: isActive },
    'no-tooltip'
  );
  const iconProps = typeof icon === 'string' ? { name: icon } : icon;
  const label = isActive && labelWhenActive ? labelWhenActive : props.label;

  const handleClick = event => {
    if (onClick) {
      disableTools();
      onClick(event, props);
    }
  };

  const cypressSelectorId = props.label.toLowerCase();

  return (
    <Tooltip title={t(label)}>
      <div
        className={className}
        onClick={handleClick}
        data-cy={cypressSelectorId}
      >
        {iconProps && <Icon {...iconProps} />}
      </div>
    </Tooltip>
  );
}

ToolbarButton.propTypes = {
  id: PropTypes.string,
  isActive: PropTypes.bool,
  /** Display label for button */
  label: PropTypes.string.isRequired,
  /** Alternative text to show when button is active */
  labelWhenActive: PropTypes.string,
  className: PropTypes.string.isRequired,
  icon: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.shape({
      name: PropTypes.string.isRequired,
    }),
  ]),
  onClick: PropTypes.func,
  /** Determines if we show expandable 'caret' symbol */
  isExpandable: PropTypes.bool,
  /** Direction of expandable 'caret' symbol */
  isExpanded: PropTypes.bool,
  t: PropTypes.func.isRequired,
};

ToolbarButton.defaultProps = {
  isActive: false,
  className: 'toolbar-button',
};

export default withTranslation('Buttons')(ToolbarButton);
