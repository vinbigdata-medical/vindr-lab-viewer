import React from 'react';
import SummaryFindings from './SummaryFindings';
import SummaryImpression from './SummaryImpression';
import SummaryComment from './SummaryComment';
import ToolsArchiveButton from './ToolsArchiveButton';
import { useSelector } from 'react-redux';
import get from 'lodash/get';

function TabSummary(props) {
  const extensions = useSelector(state => state.extensions);
  const currentTask = get(extensions, 'session.currentTask');

  return (
    <>
      {currentTask && currentTask.archived && <ToolsArchiveButton />}
      <SummaryFindings onItemClick={props.onItemClick} />
      <SummaryImpression />
      <SummaryComment />
    </>
  );
}

export default React.memo(TabSummary);
