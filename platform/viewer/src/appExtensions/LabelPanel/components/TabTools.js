import React from 'react';
import ToolsAnnotation from './ToolsAnnotation';
import ToolsImpression from './ToolsImpression';
import ToolsComment from './ToolsComment';
import ToolsArchiveButton from './ToolsArchiveButton';

function TabTools() {
  return (
    <>
      <ToolsArchiveButton />
      <ToolsAnnotation />
      <ToolsImpression />
      <ToolsComment />
    </>
  );
}

export default React.memo(TabTools);
