import { ContextMenu } from '@ohif/ui';
import PropTypes from 'prop-types';
import React from 'react';
import { commandsManager } from './../App.js';

const toolTypes = [
  'Angle',
  'Bidirectional',
  'Length',
  'FreehandMouse',
  'FreehandRoi',
  'EllipticalRoi',
  'CircleRoi',
  'RectangleRoi',
];

const ToolContextMenu = ({ isTouchEvent, eventData, onClose, onDelete }) => {
  const defaultDropdownItems = [
    {
      label: 'Delete measurement',
      actionType: 'Delete',
      action: ({ nearbyToolData, eventData }) =>
        onDelete(nearbyToolData, eventData),
    },
  ];

  const getDropdownItems = (eventData, isTouchEvent = false) => {
    const nearbyToolData = commandsManager.runCommand('getNearbyToolData', {
      element: eventData.element,
      canvasCoordinates: eventData.currentPoints.canvas,
      availableToolTypes: toolTypes,
    });

    /*
     * Annotate tools for touch events already have a press handle to edit it,
     * has a better UX for deleting it.
     */
    if (
      isTouchEvent &&
      nearbyToolData &&
      nearbyToolData.toolType === 'arrowAnnotate'
    ) {
      return;
    }

    let dropdownItems = [];
    if (nearbyToolData) {
      defaultDropdownItems.forEach(item => {
        item.params = { eventData, nearbyToolData };

        if (item.actionType === 'setDescription') {
          item.label = `${
            nearbyToolData.tool.description ? 'Edit' : 'Add'
          } Description`;
        }

        dropdownItems.push(item);
      });
    }
    return dropdownItems;
  };

  const onClickHandler = ({ action, params }) => {
    action(params);
    if (onClose) {
      onClose();
    }
  };

  const dropdownItems = getDropdownItems(eventData, isTouchEvent);

  return (
    <div className="ToolContextMenu">
      <ContextMenu items={dropdownItems} onClick={onClickHandler} />
    </div>
  );
};

ToolContextMenu.propTypes = {
  isTouchEvent: PropTypes.bool.isRequired,
  eventData: PropTypes.object,
  onClose: PropTypes.func,
  onDelete: PropTypes.func,
};

ToolContextMenu.defaultProps = {
  isTouchEvent: false,
};

export default ToolContextMenu;
