import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Menu, Dropdown, Tooltip } from 'antd';
import { Settings } from '../../assets';
import { commandsManager } from '../../App';

function WindowLevelSettings() {
  const [windowLevelOptions, setWindowLevelOptions] = useState([]);
  const windowLevelData = useSelector(
    state => state.preferences.windowLevelData
  );

  useEffect(() => {
    const customOptions = Object.keys(windowLevelData).map(key => {
      const item = windowLevelData[key];

      return {
        value: {
          window: item.window,
          level: item.level,
          preset: Number(key),
        },
        label: item.description,
      };
    });
    setWindowLevelOptions(customOptions);
  }, [windowLevelData]);

  const handleChangeWindowLevel = preset => {
    commandsManager.runCommand(`windowLevelPreset${preset}`);
  };

  const menu = (
    <Menu>
      {windowLevelOptions.map(item => (
        <Menu.Item
          key={item.value.preset}
          onClick={() => handleChangeWindowLevel(item.value.preset)}
        >
          {`${item.value.preset} - ${item.label}
              ${
                item.value.preset !== 0
                  ? `(ww: ${item.value.window}, wl: ${item.value.level})`
                  : ''
              }`}
        </Menu.Item>
      ))}
    </Menu>
  );

  return (
    <div>
      <Dropdown overlay={menu} trigger={['click']}>
        <Tooltip title="Window Width/Level">
          <div className="toolbar-button no-tooltip" data-cy="tag settings">
            <Settings />
          </div>
        </Tooltip>
      </Dropdown>
    </div>
  );
}

export default WindowLevelSettings;
