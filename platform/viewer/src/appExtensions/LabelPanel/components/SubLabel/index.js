import React, { useEffect } from 'react';
import { Radio, Tooltip } from 'antd';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import get from 'lodash/get';
import { Icon } from '@ohif/ui';

import { isEmpty } from '../../../../utils/helpers';
import { SCOPES } from '../../../../constants/constants';
import './SubLabel.styl';

function Index(props) {
  const viewports = useSelector(state => state.viewports);
  const [isExpand, setIsExpand] = React.useState(true);
  const [itemSelected, setItemSelected] = React.useState({});
  const subLabels = get(props.data, 'sub_labels');
  const title = get(props.data, 'name');
  const description = get(props.data, 'description');
  const { activeViewportIndex = 0, viewportSpecificData = {} } = viewports;
  const activeViewport = viewportSpecificData[activeViewportIndex] || {};

  useEffect(() => {
    setItemSelected({});
    if (!isEmpty(props.annotations)) {
      const subLabels = get(props.data, 'sub_labels');

      const itemFilter = props.annotations.find(item => {
        const firstLabelId = get(item, 'label_ids[0]');

        return Boolean(
          subLabels.find(sub => {
            if (sub.scope === SCOPES.STUDY) {
              return sub.id === firstLabelId;
            } else if (sub.scope === SCOPES.SERIES) {
              const meta = get(item, 'meta');
              return (
                activeViewport.SeriesInstanceUID ===
                  meta.masked_series_instance_uid && firstLabelId === sub.id
              );
            } else {
              const meta = get(item, 'meta');
              return (
                activeViewport.SeriesInstanceUID ===
                  meta.masked_series_instance_uid &&
                activeViewport.SOPInstanceUID ===
                  meta.masked_sop_instance_uid &&
                firstLabelId === sub.id
              );
            }
          })
        );
      });
      if (itemFilter) {
        const labelId = get(itemFilter, 'label_ids[0]');
        const label = subLabels.find(item => item.id === labelId);
        if (label) {
          setItemSelected({
            ...label,
            annotationId: itemFilter.id,
          });
        }
      }
    }
  }, [props.data, props.annotations, activeViewport]);

  const onChange = e => {
    const id = e.target.value;
    if (id === itemSelected.id) return;

    const filterItem = subLabels.find(item => item.id === id);

    // filter item is item that we currently checking
    // itemSelected is item that we already checked in the past
    props.handleSelect(filterItem, itemSelected);
  };

  const currentSelectId = get(itemSelected, 'id');

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
          <Radio.Group onChange={onChange} value={currentSelectId}>
            {subLabels &&
              subLabels.map(sub => (
                <Radio value={sub.id} className={'radio'} key={sub.id}>
                  <Tooltip title={sub.description || ''} placement="topLeft">
                    {sub.name}
                  </Tooltip>
                </Radio>
              ))}
          </Radio.Group>
        </div>
      )}
    </div>
  );
}

Index.propTypes = {
  data: PropTypes.object,
  handleSelect: PropTypes.func,
  annotations: PropTypes.array,
  isChecked: PropTypes.func,
};

export default React.memo(Index);
