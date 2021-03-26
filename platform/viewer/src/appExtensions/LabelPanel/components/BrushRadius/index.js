import React, { useState, useCallback, useEffect } from 'react';
import { Slider } from 'antd';
import cornerstoneTools from 'vindr-tools';

const styles = {
  wrapper: {
    margin: '20px 0',
    color: 'var(--default-color)',
  },
  radius: {
    fontSize: '11px',
  },
  slider: {
    margin: '0',
  },
};

const defaultValue = 20;

function Index() {
  const [radius, setRadius] = useState(defaultValue);
  const module = cornerstoneTools.getModule('segmentation');

  const handleChangeValue = useCallback(value => {
    setRadius(value);
    module.setters.radius(value);
  }, []);

  useEffect(() => {
    module.setters.radius(defaultValue);
  }, []);

  return (
    <div style={styles.wrapper}>
      <i style={styles.radius}>Radius</i>
      <Slider
        defaultValue={radius}
        tooltipVisible
        onChange={handleChangeValue}
        style={styles.slider}
        max={50}
      />
    </div>
  );
}

export default React.memo(Index);
