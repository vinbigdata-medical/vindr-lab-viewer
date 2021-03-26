import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Modal, message } from 'antd';
import get from 'lodash/get';
import { useSelector } from 'react-redux';
import { updateTaskArchiveStatus } from '../../LabelPanelAction';
import { isTaskOwner, getUser } from '../../../../system/systemAction';
import { TASK_STATUS } from '../../../../constants/constants';

import './ToolsArchiveButton.styl';

function ToolsArchiveButton(props) {
  const { t } = useTranslation('VinLab');
  const [username, setUsername] = useState('');

  const extensions = useSelector(state => state.extensions);
  const currentTask = get(extensions, 'session.currentTask');

  useEffect(() => {
    if (currentTask && currentTask.assignee_id) {
      handleGetUserInfo(currentTask.assignee_id);
    } else {
      setUsername('');
    }
  }, [currentTask]);

  const handleGetUserInfo = async userId => {
    try {
      const { data } = await getUser(userId);
      setUsername((data.data && data.data.username) || '');
    } catch (error) {
      console.log(error);
    }
  };

  const handleArchive = () => {
    const message = currentTask.archived
      ? 'Are you sure want to unarchive this study?'
      : 'Are you sure want to archive this study?';
    Modal.confirm({
      title: 'Confirm',
      content: message,
      okText: 'OK',
      cancelText: 'Cancel',
      onOk: onOK,
    });
  };

  const onOK = async () => {
    if (currentTask) {
      try {
        const res = await updateTaskArchiveStatus({
          id: currentTask.id,
          archived: !currentTask.archived,
        });

        if (res.status === 200) {
          message.success(t('Change task status successfully'));
        }
      } catch (error) {
        message.error(t('Error Message'));
      }
    }
  };

  const stringArchive =
    currentTask && currentTask.archived ? t('UnArchive') : t('Archive');

  return (
    <>
      {currentTask && (
        <div className="label-section archive-section">
          <div className="label-section-inner">
            <ul className="archive-list">
              <li>
                <span className={'archive-messsage'}>
                  {currentTask.archived
                    ? `${t('Archived by')} ${username}`
                    : t('Archive this study?')}
                </span>
                {isTaskOwner(currentTask) &&
                  currentTask.status !== TASK_STATUS.COMPLETED && (
                    <Button
                      className="btn-archive"
                      size="small"
                      onClick={handleArchive}
                      icon="stop"
                    >
                      {t(stringArchive)}
                    </Button>
                  )}
              </li>
            </ul>
          </div>
        </div>
      )}
    </>
  );
}

export default React.memo(ToolsArchiveButton);
