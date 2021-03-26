import commandsModule from './vinLabCommandsModule.js';

export default {
  id: 'generic-viewer-commands',
  get version() {
    return window.version;
  },
  getCommandsModule({ commandsManager, servicesManager }) {
    return commandsModule({ commandsManager, servicesManager });
  },
};
