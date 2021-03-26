import { LABEL_TYPE, TOOL_TYPE } from '../../constants/constants';

const getFreehandHandles = data => {
  const points = data.map((item, index) => {
    let lines = [];
    if (index === 0) {
      lines = data[data.length - 1];
    } else if (index === data.length - 1) {
      lines = data[0];
    } else {
      lines = data[index + 1];
    }
    return { ...item, active: true, highlight: true, lines: [lines] };
  });

  return {
    handles: {
      points,
      initialRotation: 0,
      textBox: {
        active: false,
        hasMoved: false,
        movesIndependently: false,
        drawnIndependently: false,
        allowedOutsideImage: false,
        hasBoundingBox: false,
        freehand: true,
      },
    },
  };
};

const getRectangleRoiHandles = data => {
  return {
    handles: {
      start: {
        ...data[0],
        highlight: false,
        active: false,
      },
      end: {
        ...data[1],
        highlight: false,
        active: false,
      },
      initialRotation: 0,
      textBox: {
        active: false,
        hasMoved: false,
        movesIndependently: false,
        drawnIndependently: true,
        allowedOutsideImage: true,
        hasBoundingBox: true,
      },
    },
  };
};

const getHandles = (data, toolType) => {
  switch (toolType) {
    case TOOL_TYPE.BOUNDING_BOX:
      return getRectangleRoiHandles(data);
    case TOOL_TYPE.POLYGON:
      return getFreehandHandles(data);
    default:
      return {};
  }
};

const getOtherProps = (toolType, data = {}, meta = {}) => {
  switch (toolType) {
    case TOOL_TYPE.POLYGON:
      return {
        invalidated: !meta.polyBoundingBox,
        polyBoundingBox: meta.polyBoundingBox
          ? meta.polyBoundingBox
          : {
              height: 0,
              left: 0,
              top: 0,
              width: 0,
            },
      };
    case TOOL_TYPE.MASK:
      return {
        imageIdIndex: data.imageIdIndex,
        labelMapIndex: data.labelMapIndex,
        activeSegmentIndex: data.activeSegmentIndex,
      };
    default:
      return {};
  }
};

const transformData = (boxData = [], toolType) => {
  let List = [];
  List = boxData.map((annotation, index) => {
    const { labels = [], meta = {} } = annotation;
    let boxLabel = labels.map(l => l.name);

    const color = labels[0].color || '#f4ac5a';

    return {
      invalidated: false,
      annotationId: annotation.id,
      description: annotation.description || '',
      visible: true,
      active: false,
      selected: false,
      color,
      textColor: '#fff',
      frameIndex: 0,
      toolType,
      location: annotation.label_ids || [],
      locationLabel: boxLabel,
      boxDescription: annotation.description || '',
      groupName: '',
      userInfor: {
        username: annotation.creator_name || '',
        avatar: '/medical-view/assets/avatar.jpg',
        id: annotation.creator_id,
      },
      ...getHandles(annotation.data, toolType),
      StudyInstanceUID: meta.masked_study_instance_uid,
      SeriesInstanceUID: meta.masked_series_instance_uid,
      SOPInstanceUID: meta.masked_sop_instance_uid,
      imagePath:
        meta.masked_study_instance_uid +
        '_' +
        meta.masked_series_instance_uid +
        '_' +
        meta.masked_sop_instance_uid +
        `_0`,
      ...getOtherProps(toolType, annotation.data, meta),
    };
  });
  return List;
};

export const getMeasurementData = (FINDING = [], taskId) => {
  const boundingBoxData = FINDING.filter(it => {
    if (taskId) {
      return it.type === LABEL_TYPE.BOUNDING_BOX && it.task_id === taskId;
    } else {
      return it.type === LABEL_TYPE.BOUNDING_BOX;
    }
  });
  const freehandData = FINDING.filter(it => {
    if (taskId) {
      return it.type === LABEL_TYPE.POLYGON && it.task_id === taskId;
    } else {
      return it.type === LABEL_TYPE.POLYGON;
    }
  });
  const brushData = FINDING.filter(it => {
    if (taskId) {
      return it.type === LABEL_TYPE.MASK && it.task_id === taskId;
    } else {
      return it.type === LABEL_TYPE.MASK;
    }
  });

  const RectangleRoiList = transformData(boundingBoxData, 'RectangleRoi');
  const BrushList = transformData(brushData, 'Brush');

  const FreehandRoiList = transformData(freehandData, 'FreehandRoi');
  let measurementData = {};

  if (RectangleRoiList.length) {
    measurementData.RectangleRoi = RectangleRoiList;
  }

  if (FreehandRoiList.length) {
    measurementData.FreehandRoi = FreehandRoiList;
  }

  if (BrushList.length) {
    measurementData.Brush = BrushList;
  }

  return measurementData;
};

export const getSegmentationData = (FINDING = [], taskId) => {
  return FINDING.filter(it => {
    if (taskId) {
      return it.type === LABEL_TYPE.MASK && it.task_id === taskId;
    } else {
      return it.type === LABEL_TYPE.MASK;
    }
  });
};
