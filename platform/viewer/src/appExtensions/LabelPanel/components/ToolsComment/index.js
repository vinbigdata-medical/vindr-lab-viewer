import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import get from 'lodash/get';
import './ToolsComment.styl';
import cloneDeep from 'lodash/cloneDeep';
import { useTranslation } from 'react-i18next';
import { Input } from 'antd';
import { actionSetExtensionData } from '../../../../system/systemAction';

let timeOutComment = null;

function Index(props) {
  const [task, setTask] = useState({});
  const [comment, setComment] = useState();
  const extensions = useSelector(state => state.extensions);
  const currentTask = get(extensions, 'session.currentTask');
  const { t } = useTranslation('VinLab');

  useEffect(() => {
    if (
      currentTask &&
      currentTask.comment !== comment &&
      task.id !== currentTask.id
    ) {
      setTask(currentTask);
      setComment(currentTask.comment);
    }
    // eslint-disable-next-line
  }, [currentTask]);

  const handleChangeComment = e => {
    const { value: nextValue } = e.target;
    setComment(nextValue);

    clearTimeout(timeOutComment);
    setTimeout(() => {
      const newTaskInfo = cloneDeep(currentTask);
      newTaskInfo.comment = nextValue;
      const session = get(extensions, 'session');
      session.currentTask = newTaskInfo;

      window.store.dispatch(actionSetExtensionData('session', session));
    }, 500);
  };

  return (
    <div className="label-section">
      <div className="label-section-inner">
        <h4 className="label-section-inner__title">{t('Comment')}</h4>
        <Input.TextArea
          placeholder="Comment"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          className="tools-comment"
          value={comment}
          onChange={handleChangeComment}
          autoSize={{ minRows: 3, maxRows: 5 }}
        />
      </div>
    </div>
  );
}

export default React.memo(Index);
