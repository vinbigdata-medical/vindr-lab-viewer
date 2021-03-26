import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Checkbox, Tooltip } from 'antd';
import get from 'lodash/get';
import { Empty } from '@ohif/ui';
import { useSelector } from 'react-redux';
import SubLabel from './SubLabel';
import SubCheckboxLabel from './SubLabel/SubCheckboxLabel';
import './TabPanelStyle.styl';
import {
  updateAnnotation,
  // flattenPoints,
  groupBy,
  isEmpty,
  blurActiveElement,
} from '../../../utils/helpers';

import { getMetaUIDs } from '../LabelPanelAction';
import {
  ANNOTATION_STATUS,
  SCOPES,
  // MAP_TOOL_LABEL,
} from '../../../constants/constants';
import { actionSetExtensionData } from '../../../system/systemAction';

const tabItems = [
  {
    name: 'Study',
    key: 'STUDY',
  },
  {
    name: 'Series',
    key: 'SERIES',
  },
  {
    name: 'Image',
    key: 'IMAGE',
  },
];

function ToolsImpression() {
  const { t } = useTranslation('VinLab');
  const extensions = useSelector(state => state.extensions);
  const viewports = useSelector(state => state.viewports);
  const annotationState = get(extensions, 'annotation');
  const user = get(extensions, 'user');
  const labelState = useSelector(state => state.extensions.label);
  const annotationsImpression = get(extensions, 'annotation.IMPRESSION');
  const labels = get(labelState, 'IMPRESSION');
  const { activeViewportIndex = 0, viewportSpecificData = {} } = viewports;
  const activeViewport = viewportSpecificData[activeViewportIndex] || {};

  const [tabActive, setTabActive] = useState('STUDY');
  const [annotations, setAnnotations] = useState([]);
  const [impressions, setImpressions] = useState({
    STUDY: [],
    SERIES: [],
    IMAGE: [],
  });

  useEffect(() => {
    if (!isEmpty(labels)) {
      const impressionScopes = groupBy(labels, 'scope');
      setImpressions(impressionScopes);
    }
  }, [labels]);

  useEffect(() => {
    if (annotationsImpression) {
      const annotationsList = annotationsImpression.filter(
        a => a.event !== ANNOTATION_STATUS.DELETED && a.creator_id === user.sub
      );

      setAnnotations(annotationsList);
    }
  }, [annotationsImpression, setAnnotations, annotationState]);

  const createNewAnnotation = (data, scope) => {
    const store = window.store.getState();
    const label = get(store, 'extensions.label') || {
      FINDING: [],
      IMPRESSION: [],
    };
    const user = get(store, 'extensions.user') || {};
    const annotation = get(store, 'extensions.annotation') || {};
    const IMPRESSION = get(annotation, 'IMPRESSION') || [];
    const newImpression = [...IMPRESSION];
    let allImpressions = [];
    label.IMPRESSION.length &&
      label.IMPRESSION.forEach(item => {
        if (item.sub_labels && item.sub_labels.length) {
          allImpressions = [...allImpressions, ...item.sub_labels];
        } else {
          allImpressions.push(item);
        }
      });

    const labelsFilter = allImpressions.filter(item => item.id === data.id);

    const newAnnotation = {
      creator_id: user.sub,
      description: '',
      type: 'TAG',
      event: ANNOTATION_STATUS.CREATED,
      ...getMetaUIDs(scope),
      label_ids: [data.id],
      labels: labelsFilter,
    };

    newImpression.push(newAnnotation);

    annotation.IMPRESSION = newImpression;
    window.store.dispatch(actionSetExtensionData('annotation', annotation));
  };

  const removeAnnotationFromStore = (annotationItem, lbScope) => {
    const annotation = get(extensions, 'annotation');
    const labelId2 = get(annotationItem, 'label_ids[0]');
    const metaRemove = get(annotationItem, 'meta');

    const newAnnotations =
      annotation.IMPRESSION.filter(item => {
        const labelId1 = get(item, 'label_ids[0]');
        const meta = get(item, 'meta');
        if (lbScope === SCOPES.STUDY) {
          return labelId1 !== labelId2;
        } else if (lbScope === SCOPES.SERIES) {
          return (
            labelId1 !== labelId2 ||
            meta.masked_series_instance_uid !==
              metaRemove.masked_series_instance_uid
          );
        } else {
          return (
            labelId1 !== labelId2 ||
            meta.masked_series_instance_uid !==
              metaRemove.masked_series_instance_uid ||
            meta.masked_sop_instance_uid !== metaRemove.masked_sop_instance_uid
          );
        }
      }) || [];

    const newAnnotationState = { ...annotation };

    newAnnotationState.IMPRESSION = newAnnotations;
    window.store.dispatch(
      actionSetExtensionData('annotation', newAnnotationState)
    );
  };

  const checkExistedAnnotation = useCallback(
    label => {
      const annotation = get(extensions, 'annotation') || {};
      const IMPRESSION = get(annotation, 'IMPRESSION') || [];
      const result = IMPRESSION.find(item => {
        const labelId = get(item, 'label_ids[0]');

        if (label.scope === SCOPES.STUDY) {
          return labelId === label.id;
        } else if (label.scope === SCOPES.SERIES) {
          const meta = get(item, 'meta');
          return (
            activeViewport.SeriesInstanceUID ===
              meta.masked_series_instance_uid && labelId === label.id
          );
        } else {
          const meta = get(item, 'meta');
          return (
            activeViewport.SeriesInstanceUID ===
              meta.masked_series_instance_uid &&
            activeViewport.SOPInstanceUID === meta.masked_sop_instance_uid &&
            labelId === label.id
          );
        }
      });
      return result;
    },
    [activeViewport, extensions]
  );

  const handleSelectCheckbox = useCallback(
    (checkedStatus, label) => {
      const existedItem = checkExistedAnnotation(label);
      if (checkedStatus && isEmpty(existedItem)) {
        createNewAnnotation(label, tabActive);
      } else {
        if (existedItem) {
          if (existedItem.id) {
            updateAnnotation(existedItem.id, 'IMPRESSION');
          } else {
            removeAnnotationFromStore(existedItem, label.scope);
          }
        }
      }
      blurActiveElement();
    },
    [tabActive, annotations, annotationState, activeViewport]
  );

  const handleSelectRadio = useCallback(
    (item, lastItem) => {
      const existedItem = checkExistedAnnotation(item);
      if (isEmpty(existedItem)) {
        createNewAnnotation(item, tabActive);
      }

      if (existedItem && existedItem.id) {
        updateAnnotation(existedItem.id, 'IMPRESSION');
      }

      const existedLastItem = checkExistedAnnotation(lastItem);
      if (existedLastItem) {
        if (existedLastItem.id) {
          updateAnnotation(existedLastItem.id, 'IMPRESSION'); // done
        } else {
          removeAnnotationFromStore(existedLastItem, lastItem.scope);
        }
      }
      blurActiveElement();
    },
    [tabActive, annotations, activeViewport]
  );

  const isChecked = label => {
    if (!isEmpty(annotations) && !isEmpty(label)) {
      return Boolean(
        annotations.find(item => {
          const labelId = get(item, 'label_ids[0]');
          if (label.scope === SCOPES.STUDY) {
            return labelId === label.id;
          } else if (label.scope === SCOPES.SERIES) {
            const meta = get(item, 'meta');
            return (
              activeViewport.SeriesInstanceUID ===
                meta.masked_series_instance_uid && labelId === label.id
            );
          } else {
            const meta = get(item, 'meta');
            return (
              activeViewport.SeriesInstanceUID ===
                meta.masked_series_instance_uid &&
              activeViewport.SOPInstanceUID === meta.masked_sop_instance_uid &&
              labelId === label.id
            );
          }
        })
      );
    }
    return false;
  };

  return (
    <div className="label-section">
      <div className="label-section-inner">
        <h4 className="label-section-inner__title">{t('Impression')}</h4>
        <div className="label-section-inner__list">
          {tabItems.map(item => (
            <span
              className={`label-section-inner__list__item ${
                tabActive === item.key ? 'active' : ''
              }`}
              key={item.key}
              onClick={() => setTabActive(item.key)}
            >
              {item.name}
            </span>
          ))}
        </div>
        <div className="impression-list-wrapper">
          <div className="tab-panel-item-list">
            {impressions[tabActive] && impressions[tabActive].length ? (
              impressions[tabActive].map(item => {
                if (item.sub_labels) {
                  if (item.children_select_type === 'CHECKBOX') {
                    return (
                      <SubCheckboxLabel
                        data={item}
                        isChecked={isChecked}
                        handleSelectCheckbox={(isChecked, item) =>
                          handleSelectCheckbox(isChecked, item)
                        }
                        key={item.id + item.name}
                      />
                    );
                  } else {
                    return (
                      <SubLabel
                        data={item}
                        annotations={annotations}
                        handleSelect={(item, lastItem) =>
                          handleSelectRadio(item, lastItem)
                        }
                        key={item.id + item.name}
                        isChecked={isChecked}
                      />
                    );
                  }
                }

                return (
                  <div key={item.id + item.name}>
                    <Checkbox
                      className="tab-panel-item"
                      checked={isChecked(item)}
                      onChange={e =>
                        handleSelectCheckbox(e.target.checked, item)
                      }
                      key={item.id + item.name}
                    >
                      <Tooltip
                        title={item.description || ''}
                        placement="topLeft"
                      >
                        {item.name}
                      </Tooltip>
                    </Checkbox>
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

export default React.memo(ToolsImpression);
