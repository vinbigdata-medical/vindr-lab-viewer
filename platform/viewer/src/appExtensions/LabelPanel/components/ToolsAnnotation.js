import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '@ohif/ui';
import cornerstoneTools from 'vindr-tools';
import get from 'lodash/get';
import { useSelector, useDispatch } from 'react-redux';
import { commandsManager } from '../../../App';
import {
  disableTools,
  isDisplaySetReconstructable,
} from '../../../utils/helpers';
import { PROJECT_TYPE } from '../../../constants/constants';
import { actionSetSelectedTool } from '../../../system/systemAction';
import BrushRadius from './BrushRadius';
import AddSegmentLabel from './AddSegmentLabel';
import './ToolsAnnotation.css';

const tools = [
  {
    name: 'RectangleRoi',
    icon: 'square-o',
    id: 'RectangleRoi',
    label: 'Rectangle',
    type: 'setToolActive',
    commandName: 'setToolActive',
    commandOptions: { toolName: 'RectangleRoi' },
  },
  {
    name: 'Brush',
    icon: 'brush',
    id: 'Brush',
    label: 'Brush',
    commandOptions: { toolName: 'Brush' },
  },
  {
    name: 'FreehandRoi',
    icon: 'pentagon',
    id: 'FreehandRoi',
    label: 'Freehand',
    type: 'setToolActive',
    commandName: 'setToolActive',
    commandOptions: { toolName: 'FreehandRoi' },
  },
];

const wwwcTool = {
  id: 'Wwwc',
  label: 'Levels',
  icon: 'level',
  type: 'setToolActive',
  commandName: 'setToolActive',
  commandOptions: { toolName: 'Wwwc' },
};

function ToolsAnnotation() {
  const { t } = useTranslation('VinLab');
  const dispatch = useDispatch();
  const [toolSelected, setToolSelected] = useState('');
  const [forceUpdate, setForceUpdate] = useState(0);
  const extensions = useSelector(state => state.extensions);

  const { viewportSpecificData, activeViewportIndex } = useSelector(state => {
    const { viewports = {} } = state;
    const { viewportSpecificData, activeViewportIndex } = viewports;
    return {
      viewportSpecificData,
      activeViewportIndex,
    };
  });

  const activeButtons = get(extensions, 'toolbar.activeButtons');
  const viewMode = get(extensions, 'viewMode');
  const projectDetail = get(extensions, 'session.projectDetail') || {};

  const [isMPR, setMPR] = useState(false);

  useEffect(() => {
    if (viewMode) {
      if (viewMode.mpr) {
        disableTools();
      }
      setMPR(viewMode.mpr);
    }
  }, [viewMode]);

  const isProject3D = useMemo(
    () => projectDetail.labeling_type === PROJECT_TYPE.TYPE_3D,
    [projectDetail]
  );
  const isProject2D = useMemo(
    () => projectDetail.labeling_type === PROJECT_TYPE.TYPE_2D,
    [projectDetail]
  );

  const handleActiveTool = (tool = {}) => {
    const { name: toolName } = tool;
    if (!toolName || !isProject2D) {
      return;
    }

    if (
      (toolSelected !== toolName && !isActiveTool(tool)) ||
      !isActiveTool(tool)
    ) {
      if (!isActiveTool(tool)) {
        setForceUpdate(1 - forceUpdate);
      }
      disableTools();
      setToolSelected(toolName);
      cornerstoneTools.setToolActive(toolName, {
        mouseButtonMask: 1,
      });
      dispatch(actionSetSelectedTool([tool]));
    } else {
      disableTools();
      setToolSelected('');
      if (!isActiveTool(wwwcTool.id)) {
        cornerstoneTools.setToolActive(wwwcTool.id, {
          mouseButtonMask: 1,
        });
        dispatch(actionSetSelectedTool([wwwcTool]));
      }
    }
  };

  const isActiveTool = tool => {
    const activeButtonsIds = activeButtons.map(button => button.id);
    return activeButtonsIds.includes(tool.id);
  };

  const handleOpenMPR = () => {
    if (!isDisplaySetReconstructable(viewportSpecificData, activeViewportIndex))
      return;
    commandsManager.runCommand('mpr2d');
  };

  return (
    <div className="label-section">
      <div className="label-section-inner">
        <h4 className="label-section-inner__title">{t('Annotation')}</h4>
        <div className="label-section-inner__list">
          {!isMPR &&
            isProject2D &&
            tools.map(tool => (
              <span
                className={`label-section-inner__list__item ${
                  isActiveTool(tool) ? 'active' : ''
                }${!isProject2D ? 'disabled-btn' : ''}`}
                key={tool.name}
                onClick={() => handleActiveTool(tool)}
              >
                <Icon name={tool.icon} />
              </span>
            ))}

          {!isMPR && isProject3D && (
            <span
              className={`label-section-inner__list__item ${
                !isProject3D ? 'disabled-btn' : ''
              } ${
                !isDisplaySetReconstructable(
                  viewportSpecificData,
                  activeViewportIndex
                )
                  ? 'disabled-btn'
                  : ''
              }`}
              key="open_mpr"
              onClick={handleOpenMPR}
            >
              <Icon name="cube" />
              <span className="title-item">Open MPR</span>
            </span>
          )}

          {isMPR && (
            <span
              className={`label-section-inner__list__item ${
                (viewMode || {}).activeTool ? 'active' : ''
              }${!isProject3D ? 'disabled-btn' : ''}`}
              key="mpr"
            >
              <Icon name="cube" />
            </span>
          )}
        </div>

        {!isMPR && isActiveTool(tools[1]) && (
          <div className="popup-select-label">
            <BrushRadius />
            <AddSegmentLabel />
          </div>
        )}
      </div>
    </div>
  );
}

export default React.memo(ToolsAnnotation);
