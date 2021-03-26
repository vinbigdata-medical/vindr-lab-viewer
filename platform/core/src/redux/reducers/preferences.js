const defaultState = {
  windowLevelData: {
    0: { description: 'Default', window: 'default', level: 'default' },
    1: { description: 'Brain', window: '90', level: '35' },
    2: { description: 'Bain Bone', window: '1600', level: '450' },
    3: { description: 'Spine', window: '4000', level: '700' },
    4: { description: 'Lung', window: '1500', level: '-400' },
    5: { description: 'Mediastinum', window: '350', level: '40' },
    6: { description: 'Abdomen', window: '1500', level: '-700' },
    7: { description: 'Liver', window: '400', level: '40' },
    8: { description: 'Bone', window: '1600', level: '550' },
    9: { description: 'Vessel', window: '500', level: '40' },
  },
  generalPreferences: {
    // language: 'en-US'
  },
};

const preferences = (state = defaultState, action) => {
  switch (action.type) {
    case 'SET_USER_PREFERENCES': {
      return Object.assign({}, state, action.state);
    }
    default:
      return state;
  }
};

export { defaultState };
export default preferences;
