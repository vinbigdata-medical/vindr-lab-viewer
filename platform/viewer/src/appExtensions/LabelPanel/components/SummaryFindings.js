import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import get from 'lodash/get';
import { Empty } from '@ohif/ui';
import OHIF from '@ohif/core';
import { Button, message } from 'antd';
import { groupBy, isEmpty, uuidv4 } from '../../../utils/helpers';
import { ANNOTATION_STATUS } from '../../../constants/constants';

import './TabPanelStyle.styl';
import './SummaryFindings.css';
import {
  actionSetExtensionData,
  isTaskOwner,
} from '../../../system/systemAction';

function SummaryFindings(props) {
  const { t } = useTranslation('VinLab');
  const dispatch = useDispatch();
  const measurements = useSelector(
    state => state.timepointManager.measurements
  );
  const extensions = useSelector(state => state.extensions);
  const user = get(extensions, 'user');
  const labelState = get(extensions, 'label');
  const currentTask = get(extensions, 'session.currentTask');

  const RectangleMeasure = get(measurements, 'RectangleRoi') || [];
  const FreehandRoiMeasure = get(measurements, 'FreehandRoi') || [];
  const BrushMeasure = get(measurements, 'Brush') || [];
  const annotators = get(extensions, 'reviewer.annotators');
  const allMeasurements = [
    ...RectangleMeasure,
    ...FreehandRoiMeasure,
    ...BrushMeasure,
  ];

  const newMeasurements = [];

  if (allMeasurements.length) {
    allMeasurements.forEach(measurement => {
      const location = get(measurement, 'location') || [];
      location.map(labelId => {
        const newMeasurement = {
          ...measurement,
          labelId: labelId,
        };
        newMeasurements.push(newMeasurement);
      });
    });
  }

  const getLabelName = labelId => {
    const findings = get(labelState, 'FINDING') || [];
    if (findings.length) {
      let result = {};
      for (let i = 0; i < findings.length; i++) {
        if (findings[i].id === labelId) {
          result = findings[i];
          break;
        } else if (findings[i].sub_labels) {
          const filter = findings[i].sub_labels.find(
            item => item.id === labelId
          );
          if (filter) {
            result = filter;
            break;
          }
        }
      }
      return get(result, 'name');
    }
    return '';
  };

  const groupMeasurement = groupBy(newMeasurements, 'labelId');

  const handleCopyAllInstance = () => {
    let mergedMeasurements = [];

    Object.keys(measurements).forEach(keyName => {
      const currentMeasurements = measurements[keyName];
      let filterList = currentMeasurements.filter(
        item => item.userInfor.id !== user.sub && item.annotationId
      );

      filterList = filterList.map(it => {
        return JSON.parse(JSON.stringify(it));
      });

      mergedMeasurements = [...mergedMeasurements, ...filterList];
    });

    if (!mergedMeasurements.length) {
      return;
    }

    const annotation = get(extensions, 'annotation');
    const FINDING = get(annotation, 'FINDING') || [];
    const taskId = get(currentTask, 'id');

    // handle for 2d
    mergedMeasurements = mergedMeasurements.map(it => {
      let updateData = {
        ...it,
        copyId: it.annotationId,
        userInfor: { username: user.preferred_username || '', id: user.sub },
        _id: uuidv4(),
      };
      delete updateData.annotationId;
      delete updateData.lesionNamingNumber;
      delete updateData.measurementNumber;
      return updateData;
    });

    let newFindingItem = [];

    mergedMeasurements.forEach(it => {
      let copyData = {
        ...(FINDING.find(item => item.id === it.copyId) || {}),
      };
      if (copyData) {
        copyData.meta['measurementId'] = it._id;
        copyData.creator_id = user.sub;
        copyData.task_id = taskId;
        copyData.event = ANNOTATION_STATUS.CREATED;
        delete copyData.id;
        delete copyData.created;
        delete copyData.creator_name;
        delete copyData.labels;
        newFindingItem.push(copyData);
      }
    });

    const measurementApi = OHIF.measurements.MeasurementApi.Instance;
    measurementApi.addMeasurements(groupBy(mergedMeasurements, 'toolType'));

    annotation.FINDING = [...FINDING, ...newFindingItem];
    dispatch(actionSetExtensionData('annotation', annotation));
    message.success('Coppied!');
  };

  const handleJumpToImage = (e, item = {}) => {
    if (!item.toolType) return;
    props.onItemClick(e, item);
  };

  return (
    <div className="label-section">
      <div className="label-section-inner">
        <h4 className="label-section-inner__title">{t('Study Findings')}:</h4>

        <div className="impression-list-wrapper">
          <div className="tab-panel-item-list findings-boxes">
            {Object.keys(groupMeasurement).length ? (
              <>
                {Object.keys(groupMeasurement).map(key => (
                  <div className="box-list-wrapper" key={key}>
                    <div>{getLabelName(key)}</div>
                    <div className="box-list clear-both">
                      {groupMeasurement[key] &&
                        groupMeasurement[key].map((item, index) => (
                          <div
                            className={`box-item ${
                              item.selected === true && item.visible
                                ? 'active-box'
                                : ''
                            }`}
                            key={index}
                            onClick={e => handleJumpToImage(e, item)}
                          >
                            {index + 1}
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
                {!isEmpty(annotators) && isTaskOwner(currentTask) && (
                  <div className="btn-copy-instances">
                    <Button
                      type="primary"
                      shape="round"
                      icon="copy"
                      onClick={handleCopyAllInstance}
                    >
                      {t('Copy all instance')}
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <Empty />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

SummaryFindings.propTypes = {
  onItemClick: PropTypes.func,
};

export default React.memo(SummaryFindings);
