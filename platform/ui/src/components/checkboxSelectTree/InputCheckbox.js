import { Component } from 'react';
import React from 'react';
import PropTypes from 'prop-types';
import { Checkbox, Tooltip } from 'antd';

export default class InputCheckbox extends Component {
  static propTypes = {
    value: PropTypes.string,
    label: PropTypes.string.isRequired,
    itemData: PropTypes.object.isRequired,
    labelClass: PropTypes.string,
    id: PropTypes.string.isRequired,
    onSelected: PropTypes.func.isRequired,
    checked: PropTypes.bool,
  };

  render() {
    const labelClass = this.props.labelClass ? this.props.labelClass : '';
    const { checked, itemData = {} } = this.props;
    return (
      <label
        className={'wrapperLabel radioLabel ' + labelClass}
        htmlFor={this.props.id}
      >
        <Checkbox
          id={this.props.id}
          className="radioInput"
          value={this.props.value}
          checked={checked}
          onChange={this.onSelected}
          size="small"
        />
        <span className="wrapperText">
          <Tooltip title={itemData.description || ''} placement="topLeft">
            {this.props.label}
          </Tooltip>
        </span>
      </label>
    );
  }

  onSelected = evt => {
    this.props.onSelected(evt, this.props.itemData);
  };
}
