import VTKMPRToolbarButton from './toolbarComponents/VTKMPRToolbarButton';

const TOOLBAR_BUTTON_TYPES = {
  COMMAND: 'command',
  SET_TOOL_ACTIVE: 'setToolActive',
};

const definitions = [
  {
    id: 'Crosshairs',
    label: 'Crosshairs',
    icon: 'crosshairs',
    //
    type: TOOLBAR_BUTTON_TYPES.SET_TOOL_ACTIVE,
    commandName: 'enableCrosshairsTool',
    commandOptions: {},
  },
  {
    id: 'Reset',
    label: 'Reset',
    icon: 'reset',
    type: TOOLBAR_BUTTON_TYPES.COMMAND,
    commandName: 'resetViewport',
  },
  {
    id: 'Zoom',
    label: 'Zoom',
    icon: 'search-plus',
    type: TOOLBAR_BUTTON_TYPES.SET_TOOL_ACTIVE,
    commandName: 'setToolActive',
    commandOptions: { toolName: 'Zoom' },
  },
  {
    id: 'Wwwc',
    label: 'Levels',
    icon: 'level',
    type: TOOLBAR_BUTTON_TYPES.SET_TOOL_ACTIVE,
    commandName: 'setToolActive',
    commandOptions: { toolName: 'Wwwc' },
  },
  {
    id: 'Magnify',
    label: 'Magnify',
    icon: 'circle',
    type: TOOLBAR_BUTTON_TYPES.SET_TOOL_ACTIVE,
    commandName: 'setToolActive',
    commandOptions: { toolName: 'Magnify' },
  },
  {
    id: 'Pan',
    label: 'Pan',
    icon: 'arrows',
    type: TOOLBAR_BUTTON_TYPES.SET_TOOL_ACTIVE,
    commandName: 'setToolActive',
    commandOptions: { toolName: 'Pan' },
  },
  {
    id: 'Invert',
    label: 'Invert',
    icon: 'adjust',
    type: TOOLBAR_BUTTON_TYPES.COMMAND,
    commandName: 'invertViewport',
  },
  {
    id: '2DMPR',
    label: '2D MPR',
    icon: 'cube',
    //
    CustomComponent: VTKMPRToolbarButton,
    type: TOOLBAR_BUTTON_TYPES.COMMAND,
    commandName: 'mpr2d',
    context: 'ACTIVE_VIEWPORT::CORNERSTONE',
  },
];

export default {
  definitions,
  defaultContext: 'ACTIVE_VIEWPORT::VTK',
};
