export const defaultState = {
  label: {},
  toolbar: {
    activeButtons: [],
  },
  settings: {
    isOverlayVisible: true,
    isVisibleLocalTag: true,
    isVisibleAllTag: true,
  },
  panel: {
    summary: {
      findings: [],
      impressions: [],
      notes: '',
    },
  },
  session: {},
  reviewer: {
    annotators: [],
    isAllInstanceCopied: false,
  },
};

const extensions = (state = defaultState, action) => {
  switch (action.type) {
    case 'SET_EXTENSION_DATA': {
      const extensionName = action.extension;
      const currentData = state[extensionName] || {};

      const incomingData = action.data;

      const extension = {
        [extensionName]: {
          ...currentData,
          ...incomingData,
        },
      };

      return { ...state, ...extension };
    }

    default:
      return state;
  }
};

export default extensions;
