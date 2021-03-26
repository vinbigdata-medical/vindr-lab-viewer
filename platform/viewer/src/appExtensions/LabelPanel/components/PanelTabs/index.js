import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import get from 'lodash/get';

import './PanelTabs.styl';
import { TAB_NAMES, TASK_STATUS } from '../../../../constants/constants';
import { TabSummary, TabTools } from '../index';
import { drawMeasurements, hasRole } from '../../../../utils/helpers';
import { isTaskOwner } from '../../../../system/systemAction';
import { ROLES } from '../../../../constants/constants';
import { actionGetAnnotations } from '../../LabelPanelAction';
import { getMeasurementData } from '../../ProcessData';

const navItems = [
  {
    key: 'Tools',
    title: 'Tools',
  },
  {
    key: 'Summary',
    title: 'Summary',
  },
];

const PanelNavigation = props => {
  const [selectedNav, setSelectedNav] = useState(navItems[0]);
  const [isFreezeTab, setIsFreezeTab] = useState(false);
  const extensions = useSelector(state => state.extensions);
  const currentTask = get(extensions, 'session.currentTask');

  const handleClickNav = async item => {
    if (!isFreezeTab && selectedNav.key !== item.key) {
      setSelectedNav(item);
      props.handleChangeTab(item.key);
      if (item.key === 'Tools' && hasRole(ROLES.REVIEWER)) {
        const annotators = get(extensions, 'reviewer.annotators');
        if (!annotators.length) {
          const data = await actionGetAnnotations();
          if (data && data.FINDING) {
            const measurementData = getMeasurementData(data.FINDING);
            drawMeasurements(measurementData);
          }
        }
      }
    }
  };

  useEffect(() => {
    if (currentTask && isTaskOwner(currentTask)) {
      let status = get(currentTask, 'status') || '';
      const isArchived = get(currentTask, 'archived');
      status = status.toUpperCase();

      if (status === TASK_STATUS.COMPLETED || isArchived) {
        setSelectedNav(navItems[1]);
        setIsFreezeTab(true);
      } else {
        setSelectedNav(navItems[0]);
        setIsFreezeTab(false);
      }
    } else {
      setSelectedNav(navItems[1]);
      setIsFreezeTab(true);
    }
  }, [currentTask]);

  const getTabActive = currentKey => selectedNav.key === currentKey;

  return (
    <div className="panel-nav">
      <div className="panel-nav-content">
        {navItems.map((nav, idx) => (
          <div
            key={nav.key}
            className={`panel-nav-item-wrapper
              ${getTabActive(nav.key) ? 'active-item' : ''}
              ${isFreezeTab ? 'freeze-tab' : 'not-freeze-tab'}`}
          >
            <div className="panel-nav-item" onClick={() => handleClickNav(nav)}>
              <div className="title">{nav.title}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const Index = props => {
  const [currentTab, setCurrentTab] = useState(TAB_NAMES.TOOLS);
  const extensions = useSelector(state => state.extensions);
  const currentTask = get(extensions, 'session.currentTask');

  const handleChangeTab = tabName => {
    setCurrentTab(tabName);
  };

  useEffect(() => {
    if (currentTask && isTaskOwner(currentTask)) {
      let status = get(currentTask, 'status') || '';
      let isArchived = get(currentTask, 'archived');
      status = status.toUpperCase();

      if (status === TASK_STATUS.COMPLETED || isArchived) {
        setCurrentTab(TAB_NAMES.SUMMARY);
      } else {
        setCurrentTab(TAB_NAMES.TOOLS);
      }
    } else {
      setCurrentTab(TAB_NAMES.SUMMARY);
    }
  }, [currentTask]);

  return (
    <>
      <PanelNavigation handleChangeTab={handleChangeTab} />
      {currentTab === TAB_NAMES.TOOLS && <TabTools />}
      {currentTab === TAB_NAMES.SUMMARY && (
        <TabSummary onItemClick={props.onItemClick} />
      )}
    </>
  );
};

PanelNavigation.propTypes = {
  handleChangeTab: PropTypes.func,
};

Index.propTypes = {
  onItemClick: PropTypes.func,
};

export default React.memo(Index);
