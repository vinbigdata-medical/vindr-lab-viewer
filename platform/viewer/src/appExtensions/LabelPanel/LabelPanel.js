import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import get from 'lodash/get';

import {
  actionGetLabels,
  actionGetTaskDetail,
  actionGetProjectDetail,
  actionGetAnnotations,
  actionGetAssigneeWithStudy,
} from './LabelPanelAction';
import { getMeasurementData, getSegmentationData } from './ProcessData';
import { StatusButtons, SelectLabellers, PanelTabs } from './components';
import {
  drawMeasurements,
  drawSegmentations,
  hasRole,
  disableTools,
  clearMeasurementData,
} from '../../utils/helpers';
import { ROLES } from '../../constants/constants';
import { isEmpty } from '../../utils/helpers';

import './LabelPanel.styl';
import cornerstone from 'cornerstone-core';

let currentSeries = '';
let currentTaskId = '';

const LabelPanel = props => {
  const dispatch = useDispatch();
  const extensions = useSelector(state => state.extensions);
  const user = get(extensions, 'user');
  const [currentStudyUID, setCurrentStudyUID] = useState();
  const taskId = get(extensions, 'session.currentStudy.meta.task_id');
  const projectId = get(extensions, 'session.currentStudy.meta.project_id');
  const currentStudy = get(extensions, 'session.currentStudy');
  const annotationData = get(extensions, 'annotation');
  const viewports = useSelector(state => state.viewports);

  useEffect(() => {
    if (projectId) {
      actionGetLabels({ project_id: projectId });
      actionGetProjectDetail({ projectId });
    }
    return () => {
      currentSeries = '';
      currentTaskId = '';
    };
  }, [projectId, currentStudyUID]);

  useEffect(() => {
    const StudyInstanceUID = get(currentStudy, 'meta.study_id');
    if (!isEmpty(StudyInstanceUID)) {
      actionGetAssigneeWithStudy({ StudyInstanceUID });
    }
  }, [currentStudy]);

  const callGetAnnotations = async (viewports, currentTask) => {
    const data = await actionGetAnnotations({}, currentTask);
    let counter = 0;
    let interval = setInterval(() => {
      counter++;
      if (counter === 1000) clearInterval(interval);

      const element =
        document.querySelector('.viewport-element') ||
        document.querySelector('#viewerMpr0');
      const enabledElement =
        (element && cornerstone.getEnabledElement(element)) || {};
      if (enabledElement && enabledElement.image) {
        clearInterval(interval);
        clearMeasurementData();

        const FINDING = get(data, 'FINDING');

        if (FINDING) {
          const measurementsData = getMeasurementData(FINDING, taskId);
          const segmentationsData = getSegmentationData(FINDING, taskId);

          drawSegmentations(segmentationsData, viewports);
          drawMeasurements(measurementsData);
          disableTools();
        }
      }
    }, 200);
  };

  useEffect(() => {
    if (!isEmpty(user) && viewports && viewports.viewportSpecificData) {
      const { activeViewportIndex = 0, viewportSpecificData = {} } = viewports;
      const activeViewport = viewportSpecificData[activeViewportIndex] || {};
      if (activeViewport.StudyInstanceUID) {
        // draw segmentation when click next serires
        if (
          activeViewport.SeriesInstanceUID !== currentSeries &&
          annotationData
        ) {
          currentSeries = activeViewport.SeriesInstanceUID;
          const FINDING = get(annotationData, 'FINDING');
          if (FINDING) {
            const segmentationsData = getSegmentationData(FINDING, taskId);
            drawSegmentations(segmentationsData, viewports);
          }
        }

        if (
          activeViewport.StudyInstanceUID !== currentStudyUID ||
          currentTaskId !== taskId
        ) {
          clearMeasurementData();
          if (taskId && currentTaskId !== taskId) {
            dispatch(
              actionGetTaskDetail({ id: taskId }, currentTask =>
                callGetAnnotations(viewports, currentTask)
              )
            );
          } else {
            callGetAnnotations(viewports);
          }
          setCurrentStudyUID(activeViewport.StudyInstanceUID);
          currentTaskId = taskId;
        }
      }
    }
  }, [viewports, user, taskId]);

  return (
    <div className="label-panel-container">
      <StatusButtons />
      {hasRole(ROLES.REVIEWER) && <SelectLabellers />}
      <div className="label-wrapper">
        <div className="label-content">
          <PanelTabs onItemClick={props.onItemClick} />
        </div>
      </div>
    </div>
  );
};

LabelPanel.propTypes = {
  measurementApi: PropTypes.object,
  isStudyLoaded: PropTypes.bool,
  onItemClick: PropTypes.func,
};

export default React.memo(LabelPanel);
