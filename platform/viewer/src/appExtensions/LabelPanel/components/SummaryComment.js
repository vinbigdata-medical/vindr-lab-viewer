import React from 'react';
import { useSelector } from 'react-redux';
import get from 'lodash/get';
import { useTranslation } from 'react-i18next';

function SummaryComment() {
  const extensions = useSelector(state => state.extensions);
  const comment = get(extensions, 'session.currentTask.comment');
  const { t } = useTranslation('VinLab');

  const styles = {
    background: 'var(--primary-background-color)',
    padding: '10px',
    color: 'var(--default-color)',
    borderRadius: 'var(--box-radius)',
  };

  return (
    <>
      {comment && (
        <div className="label-section">
          <div className="label-section-inner">
            <h4 className="label-section-inner__title">{t('Comment')}:</h4>
            <div className="label-section-comment" style={styles}>
              {comment}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default React.memo(SummaryComment);
