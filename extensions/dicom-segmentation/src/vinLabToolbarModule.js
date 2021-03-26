const TOOLBAR_BUTTON_TYPES = {
  COMMAND: 'command',
  SET_TOOL_ACTIVE: 'setToolActive',
  BUILT_IN: 'builtIn',
};

const definitions = [
  // {
  //   id: 'BrushEraser',
  //   label: 'Eraser',
  //   icon: 'eraser',
  //   //
  //   type: TOOLBAR_BUTTON_TYPES.SET_TOOL_ACTIVE,
  //   commandName: 'setToolActive',
  //   commandOptions: { toolName: 'BrushEraser' },
  // },
];

export default {
  definitions,
  defaultContext: 'ACTIVE_VIEWPORT::CORNERSTONE',
};
