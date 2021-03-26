import { CheckboxSelectTree } from '@ohif/ui';
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import cloneDeep from 'lodash.clonedeep';
import { useSelector } from 'react-redux';
import { Icon } from '@ohif/ui';
import { Button } from 'antd';
import { useTranslation } from 'react-i18next';
import LabellingTransition from './LabellingTransition.js';
import { MAP_TOOL_LABEL, LABELLING_ACTIONS } from '../../constants/constants';
import './LabellingFlow.css';

const LabellingFlow = ({
  measurementData,
  editLocation,
  editDescription,
  skipAddLabelButton,
  updateLabelling,
  labellingDoneCallback,
  cancelLabellingCallback,
  toolType,
  actionType,
}) => {
  const [showComponent, setShowComponent] = useState(true);
  const [state, setState] = useState({
    measurementData,
    editLocation,
    editDescription,
    skipAddLabelButton,
    labelsSelected: [],
  });
  const [labellingData, setLabellingData] = useState([]);
  const labelState = useSelector(state => state.extensions.label) || {};
  const { t } = useTranslation('VinLab');

  useEffect(() => {
    if (toolType && labelState) {
      const { FINDING } = labelState;
      let lbData = (FINDING || [])
        .filter(it => MAP_TOOL_LABEL[toolType] === it.annotation_type)
        .map(lb => ({ ...lb, label: lb.name, value: lb.id }));

      let mergeSublabel = [];
      lbData.forEach(it => {
        if (it.sub_labels) {
          (it.sub_labels || []).forEach(sb => {
            mergeSublabel.push({
              ...sb,
              label: `${sb.name} (${it.name})`,
              value: sb.id,
            });
          });
        } else {
          mergeSublabel.push(it);
        }
      });
      setLabellingData(mergeSublabel || []);
    }
  }, [labelState, toolType]);

  useEffect(() => {
    if (actionType === LABELLING_ACTIONS.UPDATE) {
      let filterLabel = [];
      const location = measurementData.location;
      labellingData.forEach(label => {
        if (location && location.includes(label.id)) {
          filterLabel.push(label);
        }
        if (label.sub_labels) {
          const subLabelFilter = label.sub_labels.filter(item =>
            location.includes(item.id)
          );
          filterLabel = [...filterLabel, ...subLabelFilter];
        }
      });
      setState({ ...state, labelsSelected: filterLabel });
    }
  }, [measurementData, labellingData]);

  useEffect(() => {
    const newMeasurementData = cloneDeep(measurementData);

    if (editDescription) {
      newMeasurementData.description = undefined;
    }

    if (editLocation) {
      newMeasurementData.location = undefined;
    }

    let newEditLocation = editLocation;
    if (!editDescription && !editLocation) {
      newEditLocation = true;
    }

    setState(state => ({
      ...state,
      editLocation: newEditLocation,
      measurementData: newMeasurementData,
    }));
  }, [editDescription, editLocation, measurementData]);

  const handleSubmit = () => {
    labellingDoneCallback(state.measurementData);
    if (updateLabelling) {
      updateLabelling(state.measurementData);
    }
  };

  const handleSelected = (event, itemSelected) => {
    let newLabelsSelected = cloneDeep(state.labelsSelected);

    const itemExistedIndex = newLabelsSelected.findIndex(
      label => label.id === itemSelected.id
    );

    if (itemExistedIndex > -1) {
      newLabelsSelected.splice(itemExistedIndex, 1);
    } else {
      newLabelsSelected = [...state.labelsSelected, itemSelected];
    }

    const newMeasurementData = {
      ...state.measurementData,
      location: newLabelsSelected.map(l => l.id), // location is ids of label
      locationLabel: newLabelsSelected.map(l => l.name), // locationLabel is label name
      color: itemSelected.color,
    };

    if ((newLabelsSelected || []).length > 0) {
      newMeasurementData.color = newLabelsSelected[0].color;
    }

    setState(state => ({
      ...state,
      editLocation: false,
      measurementData: newMeasurementData,
      labelsSelected: newLabelsSelected,
    }));
  };

  const fadeOutAndLeaveFast = () => setShowComponent(false);

  const labellingStateFragment = () => {
    return (
      <div className="labelling-wrapper">
        <div
          className="close-popup"
          onClick={() => {
            cancelLabellingCallback();
            fadeOutAndLeaveFast();
          }}
        >
          <Icon name="cancel" />
        </div>

        <CheckboxSelectTree
          items={labellingData}
          columns={1}
          onSelected={handleSelected}
          labelsSelected={state.labelsSelected}
          selectTreeFirstTitle="Assign Label"
        />
        <div className="annotation-description">
          <h4 className="description-title">{t('Annotation description')}</h4>
          <textarea
            placeholder={t('Description')}
            rows={3}
            defaultValue={state.measurementData.description}
            onChange={e => {
              const newDescriptions = e.target.value;
              setState(state => ({
                ...state,
                measurementData: {
                  ...state.measurementData,
                  description: newDescriptions,
                },
              }));
            }}
          />
        </div>
        <div className="actions">
          <Button
            type="danger"
            onClick={() => {
              cancelLabellingCallback();
              fadeOutAndLeaveFast();
            }}
          >
            {t('Cancel')}
          </Button>
          <Button
            type="primary"
            onClick={handleSubmit}
            disabled={(state.labelsSelected || []).length === 0}
          >
            {t('Submit')}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <LabellingTransition
      displayComponent={showComponent}
      onTransitionExit={() => labellingDoneCallback()}
    >
      <>
        <div
        // className={`labellingComponent ${state.editDescription &&
        //   'editDescription'}`}
        // onMouseLeave={fadeOutAndLeave}
        // onMouseEnter={clearFadeOutTimer}
        >
          {labellingStateFragment()}
        </div>
      </>
    </LabellingTransition>
  );
};

LabellingFlow.propTypes = {
  measurementData: PropTypes.object.isRequired,
  labellingDoneCallback: PropTypes.func.isRequired,
  updateLabelling: PropTypes.func,
  initialTopDistance: PropTypes.number,
  skipAddLabelButton: PropTypes.bool,
  editLocation: PropTypes.bool,
  editDescription: PropTypes.bool,
  toolType: PropTypes.string,
  actionType: PropTypes.string,
  cancelLabellingCallback: PropTypes.func,
};

LabellingFlow.defaultProps = {
  skipAddLabelButton: false,
  editLocation: false,
  editDescription: false,
};

export default LabellingFlow;
