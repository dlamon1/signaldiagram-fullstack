import type { PanelObj, PanelsType } from '$lib/types/PanelTypes';
import type { SnapPointObj, SnapPointsType } from '$lib/types/SnapPointTypes';
import type { DirectionButton } from '$lib/types/MiscTypes';
import { get } from 'svelte/store';
import { currentScreenIndex, screens } from '$lib/store.designer';

export class DirectionObjController {
  potentialNextPanel: PanelObj | null = null;
  next: {
    panelDirectionArray: {
      x: 0 | 1 | -1;
      y: 0 | 1 | -1;
      snapPointIndexes: {
        origin: 0 | 1;
        destination: 0 | 1;
      };
    }[];
    panel: PanelObj | null;
    snapPoint: SnapPointObj | null;
  } = {
    panelDirectionArray: [],
    panel: null,
    snapPoint: null
  };
  previous: {
    panel: PanelObj | null;
    snapPoint: SnapPointObj | null;
  } = {
    panel: null,
    snapPoint: null
  };
  panelDirectionCount: number = 0;
  origin: {
    x: number;
    y: number;
    panel: PanelObj | null;
    snapPoint: SnapPointObj | null;
    snapPointIndex: number;
  } = { x: 0, y: 0, panel: null, snapPoint: null, snapPointIndex: 0 };
  // @ts-ignore
  transform: string;
  boundingPanelIndexes: {
    topLeft: number;
    topRight: number;
    bottomLeft: number;
    bottomRight: number;
  } = {
    topLeft: 0,
    topRight: 0,
    bottomLeft: 0,
    bottomRight: 0
  };
  selectedPanels: PanelObj[] = [];
  allPanels: PanelsType | null = null;
  allSnapPoints: SnapPointsType | null = null;
  panelArrayFullyIterated: boolean = false;
  shouldQuit: boolean = false;
  iterationCount = 0;

  constructor(directionButton: DirectionButton) {
    this.init(directionButton);
  }

  private init(directionButton: DirectionButton) {
    // set origin direction coordinates
    this.setOriginDirectionCoordinates(directionButton);
    // set points array
    this.setPointsArray(directionButton);
    // set all panels
    this.seAllPanels();
    // set selected panels
    this.setSelectedPanels();
    // set snap points
    this.setSnapPoints();
    // set bounding panel indexes
    this.setBoundingPanelIndexes();
    // set origin panel
    this.setOriginPanel();
    // set origin snap point
    this.setOriginSnapPoint();
  }

  handleDrawSignalLines() {
    console.log('draw signal lines');
    this.iterateOverSelectedPanels();
  }

  private iterateOverSelectedPanels = () => {
    if (this.shouldQuit) {
      console.log('should quit');
      return;
    }

    // get potential next panel
    this.getPotentialNextPanel();

    // check if next panel is within bounds of this direction
    let panelIsWithinBounds = this.checkIfPanelIsWithinBounds();

    // is yes, add signal line
    // if not, get next panel direction
    if (panelIsWithinBounds) {
      this.setPanelsAndAddSignalLine();
      this.iterateOverSelectedPanels();
      return;
    } else {
      // get new potential next panel
      this.getPotentialNextPanelInNewDirection();
      // check if next panel is within bounds of this direction
      panelIsWithinBounds = this.checkIfPanelIsWithinBounds();
      // if not, exit loop
      if (!panelIsWithinBounds) {
        this.shouldQuit = true;
        return;
      }
    }

    if (this.shouldQuit) {
      console.log('should quit');
      return;
    }

    // if yes, create the turn signal lines
    this.addBothTurnSignalLines();

    // // loop
    this.iterateOverSelectedPanels();
  };

  private setPointsArray(directionbutton: DirectionButton) {
    this.next.panelDirectionArray = directionbutton.next.panelDirectionArray;
  }

  private setSnapPoints() {
    this.allSnapPoints = get(screens)[get(currentScreenIndex)!].snapPoints;
  }

  private setOriginDirectionCoordinates(directionbutton: DirectionButton) {
    this.origin.x = directionbutton.origin.x;
    this.origin.y = directionbutton.origin.y;
  }

  private setOriginPanel() {
    let originPanelColumn = this.selectedPanels[0].column;
    let originPanelRow = this.selectedPanels[0].row;

    if (!this.allPanels) {
      console.log('no all panels');
      return;
    }

    for (const boundsKey of Object.keys(this.boundingPanelIndexes)) {
      // @ts-ignore
      const panelIndex = this.boundingPanelIndexes[boundsKey];

      const panel = this.allPanels.array[panelIndex];

      if (
        (this.origin.x === -1 && panel.column < originPanelColumn) ||
        (this.origin.x === 1 && panel.column > originPanelColumn)
      ) {
        originPanelColumn = panel.column;
      }

      if (
        (this.origin.y === -1 && panel.row < originPanelRow) ||
        (this.origin.y === 1 && panel.row > originPanelRow)
      ) {
        originPanelRow = panel.row;
      }
    }

    const originPanel = this.allPanels.array.find((p) => {
      return p.column === originPanelColumn && p.row === originPanelRow;
    });

    if (!originPanel) {
      console.log('no origin panel');
      return;
    }

    this.origin.panel = originPanel;
    this.origin.x = originPanelColumn;
    this.origin.y = originPanelRow;
  }

  private setOriginSnapPoint() {
    const originPanel = this.origin.panel;

    if (!originPanel || !this.allSnapPoints) {
      console.log('no origin panel');
      return;
    }

    const directionSnapPointIndexes = this.next.panelDirectionArray[0].snapPointIndexes;

    const snapPointIndex = originPanel.thisPanelsSnapPoints[directionSnapPointIndexes.origin];
    const originSnapPoint = this.allSnapPoints.array[snapPointIndex];

    this.origin.snapPointIndex = snapPointIndex;
    this.origin.snapPoint = originSnapPoint;

    console.log('origin snap point index', snapPointIndex);
    console.log('origin snap point', originSnapPoint);
  }

  private setSelectedPanels() {
    const selectedArray: PanelObj[] = [];

    this.allPanels!.array.forEach((p) => {
      if (p.isSelected) {
        selectedArray.push(p);
      }
    });

    this.selectedPanels = selectedArray;
  }

  private seAllPanels() {
    // @ts-ignore
    this.allPanels = get(screens)[get(currentScreenIndex)].panels;
  }

  private setBoundingPanelIndexes() {
    const arrayOfPanels: PanelObj[] = this.selectedPanels;

    let cornerPanelIndexes = {
      topleft: arrayOfPanels[0].i,
      topright: arrayOfPanels[0].i,
      bottomleft: arrayOfPanels[0].i,
      bottomright: arrayOfPanels[0].i
    };

    arrayOfPanels.forEach((p) => {
      if (!this.allPanels) {
        console.log('no all panels');
        return;
      }

      if (
        p.x <= this.allPanels.array[cornerPanelIndexes.topleft].x &&
        p.y <= this.allPanels.array[cornerPanelIndexes.topleft].y
      ) {
        cornerPanelIndexes.topleft = p.i;
      }
      if (
        p.x >= this.allPanels.array[cornerPanelIndexes.topright].x &&
        p.y <= this.allPanels.array[cornerPanelIndexes.topright].y
      ) {
        cornerPanelIndexes.topright = p.i;
      }
      if (
        p.x <= this.allPanels.array[cornerPanelIndexes.bottomleft].x &&
        p.y >= this.allPanels.array[cornerPanelIndexes.bottomleft].y
      ) {
        cornerPanelIndexes.bottomleft = p.i;
      }
      if (
        p.x >= this.allPanels.array[cornerPanelIndexes.bottomright].x &&
        p.y >= this.allPanels.array[cornerPanelIndexes.bottomright].y
      ) {
        cornerPanelIndexes.bottomright = p.i;
      }
    });

    this.boundingPanelIndexes.bottomLeft = cornerPanelIndexes.bottomleft;
    this.boundingPanelIndexes.bottomRight = cornerPanelIndexes.bottomright;
    this.boundingPanelIndexes.topLeft = cornerPanelIndexes.topleft;
    this.boundingPanelIndexes.topRight = cornerPanelIndexes.topright;
  }

  private setNextPanel() {
    this.next.panel = this.potentialNextPanel;
  }

  private getPotentialNextPanel() {
    if (!this.previous.panel) {
      this.previous.panel = this.origin.panel;
      this.previous.snapPoint = this.origin.snapPoint;
    }

    if (!this.allPanels?.array) {
      console.log('no all panels');
      return;
    }

    const panelDirectionObj = this.next.panelDirectionArray[this.panelDirectionCount];

    const potentialNextPanel = this.allPanels.array.find((p) => {
      if (!this.previous.panel) {
        console.log('no previous panel');
        return;
      }

      return (
        p.column === this.previous.panel.column + panelDirectionObj.x &&
        p.row === this.previous.panel.row + panelDirectionObj.y
      );
    });

    if (potentialNextPanel) {
      this.potentialNextPanel = potentialNextPanel;
    } else {
      this.potentialNextPanel = null;
      console.log('no potential next panel');
    }
  }

  private addTurnCount() {
    this.panelDirectionCount += 1;
    if (this.panelDirectionCount === 4) {
      this.panelDirectionCount = 0;
    }
  }

  private setNextSnapPoint() {
    const count = this.panelDirectionCount;

    if (!this.next.panel) {
      console.log('no next panel');
      return;
    }

    if (!this.allSnapPoints) {
      console.log('no all snap points');
      return;
    }

    const nextDirectionSnapPointIndex =
      this.next.panelDirectionArray[count].snapPointIndexes.destination;

    const snapPointIndex = this.next.panel.thisPanelsSnapPoints[nextDirectionSnapPointIndex];

    this.next.snapPoint = this.allSnapPoints.array[snapPointIndex];

    return this;
  }

  private addSignalLine() {
    const signalLines = get(screens)[get(currentScreenIndex)!].signalLines;

    const signalLine = {
      origin: this.previous.snapPoint,
      destination: this.next.snapPoint
    };

    if (!signalLine.origin) {
      console.log('no signal lines origin');
      return;
    }

    if (!signalLine.destination) {
      console.log('no signal lines destination');
      return;
    }

    signalLines.setOriginSnapPointIndex(signalLine.origin);
    signalLines.setDestinationSnapPointIndex(signalLine.destination);

    signalLines.addSignalLine();
  }

  private setPreviousPanel() {
    this.previous.panel = this.next.panel;
  }

  private setPreviousSnapPoint() {
    if (!this.next.snapPoint) {
      console.log('no next snap point');
      return;
    }

    if (!this.allSnapPoints) {
      console.log('no all snap points');
      return;
    }

    if (!this.previous.panel) {
      console.log('no previous panel');
      return;
    }

    // const snapPoints = get(screens)[get(currentScreenIndex)!].snapPoints.array;

    const panelSnapPoints = this.previous.panel.thisPanelsSnapPoints;

    const lastUsedSnapPointIndex = this.next.snapPoint.pointIndexFullArray;

    const updatedArray = panelSnapPoints.filter((sp) => sp != lastUsedSnapPointIndex);

    this.previous.snapPoint = this.allSnapPoints.array[updatedArray[0]];
  }

  private addBothTurnSignalLines() {
    this.getPotentialNextPanel();

    this.setPanelsAndAddSignalLine();

    this.addTurnCount();

    this.getPotentialNextPanel();

    this.setPanelsAndAddSignalLine();
  }

  private checkIfPanelIsWithinBounds() {
    const panel = this.potentialNextPanel;
    const panels = this.allPanels?.array;

    if (!panel) {
      console.log('no panel');
      return false;
    }

    if (!panels) {
      console.log('no panels');
      return false;
    }

    const panelIsInBounds =
      panel.column >= panels[this.boundingPanelIndexes.topLeft].column &&
      panel.column <= panels[this.boundingPanelIndexes.topRight].column &&
      panel.row >= panels[this.boundingPanelIndexes.topLeft].row &&
      panel.row <= panels[this.boundingPanelIndexes.bottomLeft].row;

    return panelIsInBounds;
  }

  private getPotentialNextPanelInNewDirection() {
    this.addTurnCount();

    this.getPotentialNextPanel();
  }

  private setPanelsAndAddSignalLine() {
    this.setNextPanel();
    this.setNextSnapPoint();
    this.addSignalLine();
    this.setPreviousPanel();
    this.setPreviousSnapPoint();
  }
}
