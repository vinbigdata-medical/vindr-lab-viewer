import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import get from 'lodash/get';
import { Empty } from '@ohif/ui';

import { groupBy, hasRole, isEmpty } from '../../../utils/helpers';
import { ANNOTATION_STATUS, ROLES } from '../../../constants/constants';
import './TabPanelStyle.styl';

function SummaryImpression() {
  const { t } = useTranslation('VinLab');
  const extensions = useSelector(state => state.extensions);

  const annotation = get(extensions, 'annotation');
  let impressions = get(annotation, 'IMPRESSION') || [];

  let impressionsGroup = {};

  if (hasRole(ROLES.REVIEWER)) {
    const annotators = get(extensions, 'reviewer.annotators') || [];
    if (!annotators.length) {
      impressions = [];
    }
  }

  if (impressions && impressions.length) {
    impressions = impressions.filter(
      item => item.event !== ANNOTATION_STATUS.DELETED
    );
  }

  if (!isEmpty(impressions)) {
    impressionsGroup = groupBy(impressions, 'creator_id');
  } else {
    impressionsGroup = {};
  }

  return (
    <div className="label-section">
      <div className="label-section-inner">
        <h4 className="label-section-inner__title">
          {t('Study Impressions')}:
        </h4>

        <div className="impression-list-wrapper">
          <div className="tab-panel-item-list impression-list">
            {Object.keys(impressionsGroup).length ? (
              Object.keys(impressionsGroup).map((key, index) => {
                const impression = impressionsGroup[key] || [];
                return (
                  <div key={index} style={{ marginBottom: '10px' }}>
                    {Object.keys(impressionsGroup).length > 1 && (
                      <div className="creator-name">
                        {impression[0].creator_name || ''}
                      </div>
                    )}
                    {impression.map((item, idx) => (
                      <div className="impression-item" key={idx}>
                        <span>{item.labels[0].name}</span>
                        <span>{1}</span>
                      </div>
                    ))}
                  </div>
                );
              })
            ) : (
              <Empty />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default React.memo(SummaryImpression);
