import React from 'react';
import { Icon } from 'antd';
import { useTranslation } from 'react-i18next';
import { isEmpty } from 'lodash';
import cornerstoneTools from 'vindr-tools';
import { useDispatch } from 'react-redux';
import './LeftNavigation.styl';
import {
  saveAllAnnotations,
  actionSetSelectedTool,
} from '@ohif/viewer/src/system/systemAction';
import { isActiveTool } from '@ohif/viewer/src/utils/helpers';
import { servicesManager } from '@ohif/viewer/src/App';

const NAV_TYPE = {
  STUDY: 'STUDY',
  SERIES: 'SERIES',
  IMAGE: 'IMAGE',
};

const wwwcTool = {
  id: 'Wwwc',
  label: 'Levels',
  icon: 'level',
  type: 'setToolActive',
  commandName: 'setToolActive',
  commandOptions: { toolName: 'Wwwc' },
};

const LeftNavigation = props => {
  const dispatch = useDispatch();
  const { t } = useTranslation('VinLab');
  const { selectedNav } = props;

  const {
    studies = [],
    displaySetData,
    onChangeSeries,
    onChangeImage,
    activeViewportData,
    session,
    onChangeStudy,
  } = props;
  const { thumbnails = [] } = studies.length > 0 ? studies[0] : {};
  const { numImageFrames: totalImg = 0, frameIndex = 0, seriesIndex = 0 } =
    activeViewportData || {};
  const { studyIndex = 0, count: totalStudy = 0 } = session || {};

  const navItems = [
    {
      key: NAV_TYPE.IMAGE,
      title: t('Image'),
      mainIc: 'file-image',
      currentItem: frameIndex || 0,
      total: totalImg,
    },
    {
      key: NAV_TYPE.SERIES,
      title: t('Series'),
      mainIc: 'file-image',
      currentItem: seriesIndex || 0,
      total: thumbnails.length,
    },
    {
      key: NAV_TYPE.STUDY,
      title: t('Study'),
      mainIc: 'appstore',
      currentItem: studyIndex,
      total: totalStudy,
    },
  ];

  const handleClickNav = item => {
    if (selectedNav.key !== item.key) {
      props.onOpenPanel(true, item);
    } else {
      props.onOpenPanel(false);
    }
  };

  const onClickNextItem = (event, type, isPrevious = false) => {
    event.stopPropagation();
    if (isEmpty(displaySetData) || isEmpty(studies)) return;
    const { UIDialogService } = servicesManager.services;

    if (type === NAV_TYPE.STUDY) {
      let newIdx = studyIndex + (isPrevious ? -1 : 1);
      if (
        (isPrevious && newIdx < 0) ||
        (!isPrevious && newIdx === totalStudy)
      ) {
        return;
      }

      if (!isActiveTool(wwwcTool.id)) {
        cornerstoneTools.setToolActive(wwwcTool.id, {
          mouseButtonMask: 1,
        });
        dispatch(actionSetSelectedTool([wwwcTool]));
      }
      if (!isActiveTool('Pan')) {
        cornerstoneTools.setToolActive('Pan', { mouseButtonMask: 4 });
      }
      if (!isActiveTool('Zoom')) {
        cornerstoneTools.setToolActive('Zoom', { mouseButtonMask: 2 });
      }

      UIDialogService.dismissAll();
      saveAllAnnotations(true, () => {
        onChangeStudy({
          ...session,
          studyIndex: newIdx,
          currentStudy: session.data[newIdx],
        });
      });
    } else if (type === NAV_TYPE.SERIES) {
      let newIdx = seriesIndex + (isPrevious ? -1 : 1);
      if (
        (isPrevious && newIdx < 0) ||
        (!isPrevious && newIdx === thumbnails.length)
      ) {
        return;
      }
      UIDialogService.dismissAll();
      const { displaySetInstanceUID } = thumbnails[newIdx];
      onChangeSeries(displaySetInstanceUID);
    } else if (type === NAV_TYPE.IMAGE) {
      let idx = frameIndex + (isPrevious ? -1 : 1);
      if ((isPrevious && idx < 0) || (!isPrevious && idx === totalImg)) {
        return;
      }
      UIDialogService.dismissAll();
      const { SOPInstanceUID } = displaySetData.images[idx];

      const newDisplaySet = {
        ...displaySetData,
        SOPInstanceUID: SOPInstanceUID,
        frameIndex: idx,
      };
      onChangeImage(newDisplaySet);
    }
  };

  return (
    <div
      className={`nav-content ${selectedNav.key ? 'hide-border-right' : ''}`}
    >
      {navItems.map((nav, idx) => (
        <div
          key={nav.key}
          className={`nav-item-wrapper ${
            selectedNav.key === nav.key ? 'active-item' : ''
          }`}
        >
          {idx > 0 && <span className="top-corners"></span>}
          <div className="nav-item">
            <div className="title">{nav.title}</div>
            <div className="nav-icons">
              <Icon
                className="arrow-ic"
                type="left"
                onClick={event => onClickNextItem(event, nav.key, true)}
              />
              <Icon
                className="main-ic"
                type={nav.mainIc}
                onClick={() => handleClickNav(nav)}
              />
              <Icon
                className="arrow-ic"
                type="right"
                onClick={event => onClickNextItem(event, nav.key)}
              />
            </div>
            <div className="nav-item-info">{`${
              nav.total > 0 ? nav.currentItem + 1 : 0
            }/${nav.total || 0}`}</div>
          </div>
          {idx !== navItems.length - 1 && (
            <span className="bottom-corners"></span>
          )}
        </div>
      ))}
    </div>
  );
};

export default React.memo(LeftNavigation);
