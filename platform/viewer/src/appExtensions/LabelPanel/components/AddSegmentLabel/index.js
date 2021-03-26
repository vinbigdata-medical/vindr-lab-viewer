import React from 'react';
import { Button } from 'antd';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { servicesManager } from '../../../../App';
import VinLabLabellingFlow from '../../../../components/VinLabLabelling/VinLabLabellingFlow';
import get from 'lodash/get';
import {
  compressRLE,
  handleCompleteAnnotation,
  uuidv4,
} from '../../../../utils/helpers';
import OHIF from '@ohif/core';
import cornerstone from 'cornerstone-core';
import csTools from 'vindr-tools';

import './AddSegmentLabel.css';

function AddLabel() {
  const { t } = useTranslation('VinLab');

  const viewports = useSelector(state => state.viewports);

  const handleUpdateMeasurementData = measurementData => {
    if (!measurementData) return;
    const measurementApi = OHIF.measurements.MeasurementApi.Instance;
    measurementApi.addMeasurement('Brush', measurementData);
  };

  const showLabellingDialog = () => {
    const measurementData = {
      visible: true,
      active: true,
      toolType: 'Brush',
      _id: uuidv4(),
    };

    const { UIDialogService } = servicesManager.services;

    const _getLabelPopupPosition = () => {
      const screenWidth = window.innerWidth;
      let x = (screenWidth - 320) / 2;
      let y = 200;

      return { x, y };
    };
    if (!UIDialogService) {
      return;
    }

    UIDialogService.dismiss({ id: 'labelling' });
    UIDialogService.create({
      id: 'labelling',
      isDraggable: false,
      showOverlay: false,
      centralize: false,
      defaultPosition: _getLabelPopupPosition(measurementData),
      content: VinLabLabellingFlow,
      contentProps: {
        measurementData,
        toolType: measurementData.toolType,
        cancelLabellingCallback: () => {
          UIDialogService.dismissAll();
        },
        labellingDoneCallback: annotationData => {
          const activeViewportIndex = get(viewports, 'activeViewportIndex');
          const enabledElements = cornerstone.getEnabledElements() || [];
          const enabledElement =
            enabledElements[activeViewportIndex] || enabledElements[0];
          const element = enabledElement && enabledElement.element;

          if (measurementData && annotationData && element) {
            const { getters, setters } = csTools.getModule('segmentation');
            const labelMap = getters.labelmap2D(element);
            const pixelData = labelMap.labelmap2D.pixelData;
            const { activeSegmentIndex } = labelMap.labelmap3D;

            const formatBitMap = pixelData.map(bit =>
              bit === activeSegmentIndex ? activeSegmentIndex : 0
            );

            const pixelDataCompressed = compressRLE(formatBitMap);
            const activeLabelmapIndex = getters.activeLabelmapIndex(element);

            const data = {
              segment: pixelDataCompressed,
              labelMapIndex: activeLabelmapIndex,
              imageIdIndex: labelMap.currentImageIdIndex,
              activeSegmentIndex: activeSegmentIndex,
            };

            setters.incrementActiveSegmentIndex(element);

            annotationData.labelMapIndex = activeLabelmapIndex;
            annotationData.imageIdIndex = labelMap.currentImageIdIndex;
            annotationData.activeSegmentIndex = activeSegmentIndex;
            annotationData.labelmap2D = {
              pixelData: '',
              segmentsOnLabelmap: labelMap.labelmap2D.segmentsOnLabelmap,
            };

            const viewportData = get(
              viewports,
              `viewportSpecificData[${activeViewportIndex}]`
            );

            const SOPInstanceUID = get(viewportData, 'SOPInstanceUID');
            const SeriesInstanceUID = get(viewportData, 'SeriesInstanceUID');
            const StudyInstanceUID = get(viewportData, 'StudyInstanceUID');

            if (SOPInstanceUID && SeriesInstanceUID && StudyInstanceUID) {
              annotationData.StudyInstanceUID = StudyInstanceUID;
              annotationData.SeriesInstanceUID = SeriesInstanceUID;
              annotationData.SOPInstanceUID = SOPInstanceUID;

              const imagePath =
                StudyInstanceUID +
                '_' +
                SeriesInstanceUID +
                '_' +
                SOPInstanceUID +
                `_0`;
              annotationData.imagePath = imagePath;
            }

            handleCompleteAnnotation({ ...annotationData, data });
            handleUpdateMeasurementData({
              ...measurementData,
              ...annotationData,
            });
          }

          UIDialogService.dismiss({ id: 'labelling' });
        },
      },
    });
  };

  return (
    <div className={'add-label-wrapper'}>
      <Button
        type="primary"
        shape="round"
        icon="save"
        onClick={showLabellingDialog}
      >
        {t('Finish')}
      </Button>
    </div>
  );
}

export default React.memo(AddLabel);
