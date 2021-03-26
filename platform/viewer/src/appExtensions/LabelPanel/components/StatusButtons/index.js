import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, message, Tooltip } from 'antd';
import get from 'lodash/get';
import { useSelector } from 'react-redux';
import {
  actionUpdateTaskStatus,
  actionGetAnnotations,
} from '../../LabelPanelAction';
import {
  TASK_STATUS,
  ANNOTATION_STATUS,
  ROLES,
} from '../../../../constants/constants';
import {
  saveAllAnnotations,
  isTaskOwner,
} from '../../../../system/systemAction';
import { hasRole } from '../../../../utils/helpers';

import './StatusButtons.styl';

function StatusButton(props) {
  const { t } = useTranslation('VinLab');

  const extensions = useSelector(state => state.extensions);
  const currentTask = get(extensions, 'session.currentTask');
  const annotation = get(extensions, 'annotation');
  const labelData = get(extensions, 'label');

  const handleCompleteTask = useCallback(async () => {
    if (currentTask) {
      try {
        const saveSuccess = await saveAllAnnotations();
        await actionGetAnnotations();
        if (saveSuccess && saveSuccess.error_code === 0) {
          const { data } = await actionUpdateTaskStatus({
            status: TASK_STATUS.COMPLETED,
            id: currentTask.id,
          });
          if (data && data.error_code === 0) {
            message.success(t('Change Task To Complete'));
          }
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        message.error(t('Error Message'));
      }
    }
  }, [currentTask, t, extensions]);

  const handleSaveAll = async () => {
    try {
      await saveAllAnnotations();
      await actionGetAnnotations();
    } catch (error) {
      message.error(t('Error Message'));
    }
  };

  const handleReassignTask = useCallback(async () => {
    if (currentTask) {
      try {
        await actionUpdateTaskStatus({
          status: TASK_STATUS.NEW,
          id: currentTask.id,
        });
      } catch (error) {
        message.error(t('Error Message'));
      }
    }
    // eslint-disable-next-line
  }, [currentTask, extensions]);

  const isDisabled = () => {
    return (
      currentTask.status === TASK_STATUS.COMPLETED || !isTaskOwner(currentTask)
    );
  };

  const disableComplete = () => {
    const labelImpression = get(labelData, 'IMPRESSION') || [];
    const impression = get(annotation, 'IMPRESSION') || [];

    return (
      !currentTask.archived &&
      labelImpression.length &&
      !impression.filter(it => it.event !== ANNOTATION_STATUS.DELETED).length
    );
  };

  return (
    <div className="header-action">
      {currentTask && (
        <>
          <div className="study-status">
            <div className="study-status-content">
              {t('Study Status')}:{' '}
              <span className="hightlight">{t(currentTask.status)}</span>
            </div>
          </div>

          <div className="two-buttons-inline">
            <Button
              className="btn-action wrap-btn"
              onClick={handleSaveAll}
              disabled={isDisabled()}
              type="primary"
              icon="save"
            >
              {t('Save')}
            </Button>
            {(!hasRole(ROLES.PROJECT_OWNER) ||
              (hasRole(ROLES.PROJECT_OWNER) &&
                currentTask.status !== TASK_STATUS.COMPLETED)) && (
              <Tooltip
                title={
                  disableComplete() &&
                  currentTask.status !== TASK_STATUS.COMPLETED
                    ? 'Please check impression or archive'
                    : ''
                }
                trigger="hover"
                placement="bottomRight"
                overlayClassName="btn-complete-tooltip"
              >
                <div className="wrap-btn">
                  <Button
                    className="btn-action btn-complete"
                    onClick={handleCompleteTask}
                    disabled={isDisabled() || disableComplete()}
                    type="primary"
                    icon="check-circle"
                  >
                    {t('Complete')}
                  </Button>
                </div>
              </Tooltip>
            )}
            {hasRole(ROLES.PROJECT_OWNER) &&
              currentTask.status === TASK_STATUS.COMPLETED && (
                <Button
                  className="btn-action wrap-btn"
                  onClick={handleReassignTask}
                  type="primary"
                  icon="undo"
                >
                  {t('Re-assign')}
                </Button>
              )}
          </div>
        </>
      )}
    </div>
  );
}

export default React.memo(StatusButton);
