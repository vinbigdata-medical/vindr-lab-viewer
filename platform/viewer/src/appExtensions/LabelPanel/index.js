import React from 'react';
import init from './init.js';
import ConnectedLabel from './ConnectedLabel';

export default {
  /**
   * Only required property. Should be a unique value across all extensions.
   */
  id: 'measurements-table',
  get version() {
    return window.version;
  },

  preRegistration({ servicesManager, commandsManager, configuration = {} }) {
    init({ servicesManager, commandsManager, configuration });
  },

  getPanelModule({ servicesManager, commandsManager }) {
    const ConnectedLabelPanel = props => {
      return <ConnectedLabel {...props} />;
    };

    return {
      menuOptions: [
        {
          icon: 'list',
          label: 'Measurements',
          target: 'lable-panel',
        },
      ],
      components: [
        {
          id: 'label-panel',
          component: ConnectedLabelPanel,
        },
      ],
      defaultContext: ['VIEWER'],
    };
  },
};
