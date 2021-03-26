import React from 'react';
import PropTypes from 'prop-types';
import { Empty as EmptyComponent } from 'antd';
import { useTranslation } from 'react-i18next';

export default function Empty({ height }) {
  const { t } = useTranslation('VinLab');
  const textStyle = {
    color: 'var(--default-color)',
  };

  return (
    <EmptyComponent
      imageStyle={{
        height: height ? height : 40,
      }}
      image={EmptyComponent.PRESENTED_IMAGE_SIMPLE}
      description={<span style={textStyle}>{t('No Data')}</span>}
    />
  );
}
Empty.propTypes = {
  height: PropTypes.any,
};
