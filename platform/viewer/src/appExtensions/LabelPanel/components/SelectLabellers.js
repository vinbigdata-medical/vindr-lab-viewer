import React from 'react';
import { Select } from 'antd';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import get from 'lodash/get';
import { ROLES } from '../../../constants/constants';
import { actionGetAnnotations } from '../LabelPanelAction';
import {
  clearMeasurementData,
  drawMeasurements,
  drawSegmentations,
} from '../../../utils/helpers';
import { getMeasurementData, getSegmentationData } from '../ProcessData';
import {
  actionSetExtensionData,
  clearAnnotations,
} from '../../../system/systemAction';

const { Option } = Select;

function SelectLabellers() {
  const { t } = useTranslation('VinLab');
  const extensions = useSelector(state => state.extensions);
  const defaultAnnotators = get(extensions, 'reviewer.annotators');
  const viewports = useSelector(state => state.viewports);

  const assignees = get(extensions, 'session.assigneesInCurrentStudy') || [];

  let annotators;
  if (assignees && assignees.length) {
    annotators = assignees.filter(
      user =>
        user.roles.includes(ROLES.ANNOTATOR) ||
        user.roles.includes(ROLES.REVIEWER)
    );
  }

  const children = [];
  if (annotators && annotators.length > 0) {
    annotators.map((item, index) =>
      children.push(<Option key={item.id}>{item.username}</Option>)
    );
  }

  const handleChange = async values => {
    try {
      let data;
      if (values.length) {
        data = await actionGetAnnotations({
          creatorIds: values,
        });
      } else {
        clearAnnotations();
        window.store.dispatch(
          actionSetExtensionData('reviewer', {
            annotators: [],
          })
        );
      }

      clearMeasurementData();

      if (data && data.FINDING) {
        const measurementData = getMeasurementData(data.FINDING);
        const segmentationsData = getSegmentationData(data.FINDING);

        drawMeasurements(measurementData);
        drawSegmentations(segmentationsData, viewports);
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="label-section">
      <div className="label-section-inner">
        <h5 className="label-section-inner__title">{t('Select labelers')}</h5>
        <Select
          mode="multiple"
          style={{ width: '100%', borderRadius: 'var(--box-radius)' }}
          placeholder={t('Please select')}
          onChange={handleChange}
          value={defaultAnnotators}
        >
          {children}
        </Select>
      </div>
    </div>
  );
}

export default React.memo(SelectLabellers);
