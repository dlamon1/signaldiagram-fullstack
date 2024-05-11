import { get } from 'svelte/store';

import { signalDirectionButtons, screens, currentScreenIndex } from '$lib/store.designer';
import { DirectionObjController } from '$lib/classes/direction_obj.controller';

import type { PanelObj, DirectionObj } from '$lib/types';
import type { DirectionButton } from '$lib/types/MiscTypes';

const setBoundingPanelIndexes = (directionObj: DirectionObj) => {
  const arrayOfPanels: PanelObj[] = directionObj.selectedPanels;

  let cornerPanelIndexes = {
    topleft: arrayOfPanels[0].i,
    topright: arrayOfPanels[0].i,
    bottomleft: arrayOfPanels[0].i,
    bottomright: arrayOfPanels[0].i
  };

  const panels = get(screens)[get(currentScreenIndex)!].panels;

  arrayOfPanels.forEach((p) => {
    if (
      p.x <= panels.array[cornerPanelIndexes.topleft].x &&
      p.y <= panels.array[cornerPanelIndexes.topleft].y
    ) {
      cornerPanelIndexes.topleft = p.i;
    }
    if (
      p.x >= panels.array[cornerPanelIndexes.topright].x &&
      p.y <= panels.array[cornerPanelIndexes.topright].y
    ) {
      cornerPanelIndexes.topright = p.i;
    }
    if (
      p.x <= panels.array[cornerPanelIndexes.bottomleft].x &&
      p.y >= panels.array[cornerPanelIndexes.bottomleft].y
    ) {
      cornerPanelIndexes.bottomleft = p.i;
    }
    if (
      p.x >= panels.array[cornerPanelIndexes.bottomright].x &&
      p.y >= panels.array[cornerPanelIndexes.bottomright].y
    ) {
      cornerPanelIndexes.bottomright = p.i;
    }
  });

  directionObj.boundingPanelIndexes.bottomLeft = cornerPanelIndexes.bottomleft;
  directionObj.boundingPanelIndexes.bottomRight = cornerPanelIndexes.bottomright;
  directionObj.boundingPanelIndexes.topLeft = cornerPanelIndexes.topleft;
  directionObj.boundingPanelIndexes.topRight = cornerPanelIndexes.topright;

  return directionObj;
};

const setSelectedPanels = (directionObj: DirectionObj) => {
  const selectedArray: PanelObj[] = [];
  const panels = get(screens)[get(currentScreenIndex)].panels;

  panels.array.forEach((p) => {
    if (p.isSelected) {
      selectedArray.push(p);
    }
  });

  directionObj.selectedPanels = selectedArray;

  return directionObj;
};

const setOriginPanel = (directionObj: DirectionObj) => {
  let originPanelColumn = directionObj.selectedPanels[0].column;
  let originPanelRow = directionObj.selectedPanels[0].row;

  for (const boundsKey of Object.keys(directionObj.boundingPanelIndexes)) {
    const panelIndex = directionObj.boundingPanelIndexes[boundsKey];

    const panel = directionObj.allPanels[panelIndex];

    if (
      (directionObj.origin.x === -1 && panel.column < originPanelColumn) ||
      (directionObj.origin.x === 1 && panel.column > originPanelColumn)
    ) {
      originPanelColumn = panel.column;
    }

    if (
      (directionObj.origin.y === -1 && panel.row < originPanelRow) ||
      (directionObj.origin.y === 1 && panel.row > originPanelRow)
    ) {
      originPanelRow = panel.row;
    }
  }

  const originPanel = directionObj.allPanels.find((p) => {
    return p.column === originPanelColumn && p.row === originPanelRow;
  });

  directionObj.origin.panel = originPanel;
  directionObj.origin.x = originPanelColumn;
  directionObj.origin.y = originPanelRow;

  return directionObj;
};

const setPanelsArray = (directionObj: DirectionObj) => {
  directionObj.allPanels = get(screens)[get(currentScreenIndex)].panels.array;

  return directionObj;
};

const setOriginSnapPoint = (directionObj: DirectionObj) => {
  const originPanel = directionObj.origin.panel;
  const snapPoints = get(screens)[get(currentScreenIndex)].snapPoints.array;

  const snapPointIndex = originPanel.thisPanelsSnapPoints[directionObj.origin.snapPointIndex];
  const originSnapPoint = snapPoints[snapPointIndex];

  directionObj.origin.snapPointIndex = snapPointIndex;
  directionObj.origin.snapPoint = originSnapPoint;

  return directionObj;
};

const setNextPanel = (directionObj: DirectionObj) => {
  directionObj.next.panel = getPotentialNextPanel(directionObj).potentialNextPanel;

  return directionObj;
};

const getPotentialNextPanel = (directionObj: DirectionObj) => {
  if (!directionObj.previous.panel) {
    directionObj.previous.panel = directionObj.origin.panel;
    directionObj.previous.snapPoint = directionObj.origin.snapPoint;
  }

  const panelDirectionObj = directionObj.next.panelDirectionArray[directionObj.panelDirectionCount];

  directionObj.potentialNextPanel = directionObj.allPanels.find((p) => {
    return (
      p.column === directionObj.previous.panel.column + panelDirectionObj.x &&
      p.row === directionObj.previous.panel.row + panelDirectionObj.y
    );
  });

  return directionObj;
};

const addTurnCount = (directionObj: DirectionObj) => {
  directionObj.panelDirectionCount += 1;
  if (directionObj.panelDirectionCount === 4) {
    directionObj.panelDirectionCount = 0;
  }
  return directionObj;
};

const setNextSnapPoint = (directionObj: DirectionObj) => {
  const snapPoints = get(screens)[get(currentScreenIndex)].snapPoints.array;

  const count = directionObj.panelDirectionCount;

  const nextDirectionSnapPointIndex =
    directionObj.next.panelDirectionArray[count].snapPointIndexes.destination;

  const snapPointIndex = directionObj.next.panel.thisPanelsSnapPoints[nextDirectionSnapPointIndex];

  directionObj.next.snapPoint = snapPoints[snapPointIndex];

  return directionObj;
};

const addSignalLine = (directionObj: DirectionObj) => {
  const signalLines = get(screens)[get(currentScreenIndex)].signalLines;

  const signalLine = {
    origin: directionObj.previous.snapPoint,
    destination: directionObj.next.snapPoint
  };

  console.log(signalLine);
  console.log('signalLine');

  signalLines.setOriginSnapPointIndex(signalLine.origin);
  signalLines.setDestinationSnapPointIndex(signalLine.destination);

  signalLines.addSignalLine();

  return directionObj;
};

const setPreviousPanel = (directionObj: DirectionObj) => {
  directionObj.previous.panel = directionObj.next.panel;

  return directionObj;
};

const setPreviousSnapPoint = (directionObj: DirectionObj) => {
  const snapPoints = get(screens)[get(currentScreenIndex)].snapPoints.array;

  const panelSnapPoints = directionObj.previous.panel.thisPanelsSnapPoints;

  const lastUsedSnapPointIndex = directionObj.next.snapPoint.pointIndexFullArray;

  const updatedArray = panelSnapPoints.filter((sp) => sp != lastUsedSnapPointIndex);

  directionObj.previous.snapPoint = snapPoints[updatedArray[0]];

  return directionObj;
};

const addBothTurnSignalLines = (directionObj: DirectionObj) => {
  directionObj = getPotentialNextPanel(directionObj);

  setPanelsAndAddSignalLine(directionObj);

  directionObj = addTurnCount(directionObj);

  directionObj = getPotentialNextPanel(directionObj);

  setPanelsAndAddSignalLine(directionObj);

  return directionObj;
};

const checkIfPanelIsWithinBounds = (directionObj: DirectionObj) => {
  const panel = directionObj.potentialNextPanel;
  const panels = directionObj.allPanels;

  if (!panel) {
    return false;
  }

  const panelIsInBounds =
    panel.column >= panels[directionObj.boundingPanelIndexes.topLeft].column &&
    panel.column <= panels[directionObj.boundingPanelIndexes.topRight].column &&
    panel.row >= panels[directionObj.boundingPanelIndexes.topLeft].row &&
    panel.row <= panels[directionObj.boundingPanelIndexes.bottomLeft].row;

  return panelIsInBounds;
};

const getPotentialNextPanelInNewDirection = (directionObj: DirectionObj) => {
  directionObj = addTurnCount(directionObj);

  const panel = getPotentialNextPanel(directionObj);

  return panel;
};

const setPanelsAndAddSignalLine = (directionObj: DirectionObj) => {
  directionObj = setNextPanel(directionObj);
  directionObj = setNextSnapPoint(directionObj);
  directionObj = addSignalLine(directionObj);
  directionObj = setPreviousPanel(directionObj);
  directionObj = setPreviousSnapPoint(directionObj);

  return directionObj;
};

const nullPotentialNextPanel = (directionObj: DirectionObj) => {
  directionObj.potentialNextPanel = null;

  return directionObj;
};

const nullPreviousPanel = (directionObj: DirectionObj) => {
  directionObj.previous.panel = null;

  return directionObj;
};

const nullPreviousSnapPoint = (directionObj: DirectionObj) => {
  directionObj.previous.snapPoint = null;

  return directionObj;
};

const nullNextPanel = (directionObj: DirectionObj) => {
  directionObj.next.panel = null;

  return directionObj;
};

const nullNextSnapPoint = (directionObj: DirectionObj) => {
  directionObj.next.snapPoint = null;

  return directionObj;
};

const nullOriginSnapPointIndex = (directionObj: DirectionObj) => {
  directionObj.origin.snapPointIndex = null;

  return directionObj;
};

const nullOriginPanel = (directionObj: DirectionObj) => {
  directionObj.origin.panel = null;

  return directionObj;
};

const nullOriginSnapPoint = (directionObj: DirectionObj) => {
  directionObj.origin.snapPoint = null;

  return directionObj;
};

const resetPanelDirectionCount = (directionObj: DirectionObj) => {
  directionObj.panelDirectionCount = 0;

  return directionObj;
};

const iterateOverSelectedPanels = (directionObj: DirectionObj) => {
  directionObj = nullPotentialNextPanel(directionObj);

  // get potential next panel
  directionObj = getPotentialNextPanel(directionObj);

  // check if next panel is within bounds of this direction
  let panelIsWithinBounds = checkIfPanelIsWithinBounds(directionObj);

  // is yes, add signal line
  // if not, get next panel direction
  if (panelIsWithinBounds) {
    setPanelsAndAddSignalLine(directionObj);
    iterateOverSelectedPanels(directionObj);
  } else {
    // get new potential next panel
    directionObj = getPotentialNextPanelInNewDirection(directionObj);
  }

  // check if next panel is within bounds of this direction
  panelIsWithinBounds = checkIfPanelIsWithinBounds(directionObj);

  // if not, exit loop
  if (!panelIsWithinBounds) {
    // console.log('turned panel is not within bounds');

    return;
  }

  // if yes, create the turn signal lines

  directionObj = addBothTurnSignalLines(directionObj);

  // set prev panel to next panel

  directionObj = setPanelsAndAddSignalLine(directionObj);

  // loop
  iterateOverSelectedPanels(directionObj);
};

// export const drawSignalLines = (directionObj: DirectionObj) => {
//   console.log(directionObj);

//   // set all panels
//   directionObj = setPanelsArray(directionObj);
//   // set selected panels
//   directionObj = setSelectedPanels(directionObj);
//   // set bounds from selected panels
//   directionObj = setBoundingPanelIndexes(directionObj);
//   // get origin panel
//   directionObj = setOriginPanel(directionObj);
//   // get origin snap point
//   directionObj = setOriginSnapPoint(directionObj);
//   // iterate over selected panels
//   iterateOverSelectedPanels(directionObj);

//   directionObj = nullOriginSnapPointIndex(directionObj);
//   directionObj = nullNextPanel(directionObj);
//   directionObj = nullNextSnapPoint(directionObj);
//   directionObj = nullPotentialNextPanel(directionObj);
//   directionObj = nullPreviousPanel(directionObj);
//   directionObj = nullPreviousSnapPoint(directionObj);
//   directionObj = nullOriginPanel(directionObj);
//   directionObj = nullOriginSnapPoint(directionObj);
//   directionObj = resetPanelDirectionCount(directionObj);

//   console.log(directionObj);

//   console.log('nulling complete');
// };

export const drawSignalLines = (directionButton: DirectionButton) => {
  const doc = new DirectionObjController(directionButton);
  console.log(doc);

  doc.handleDrawSignalLines();
};
