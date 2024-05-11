import type { PanelObj, PanelsType } from './PanelTypes';
import type { SnapPointObj } from './SnapPointTypes';

export interface ColorObj {
  background: string;
  border: string;
  font: string;
}

export type ColorObjKey = 'background' | 'border' | 'font';

export type XYCoordinates = {
  x: number;
  y: number;
};

export type XYandIndex = {
  i: number[];
  x: number;
  y: number;
};

export type DirectionButton = {
  transform: string;
  next: {
    panelDirectionArray: {
      x: 0 | 1 | -1;
      y: 0 | 1 | -1;
      snapPointIndexes: {
        origin: 0 | 1;
        destination: 0 | 1;
      };
    }[];
  };
  origin: {
    x: -1 | 0 | 1;
    y: -1 | 0 | 1;
  };
  horizontalOrVertical: 'horizontal' | 'vertical';
};

export type DirectionObj = {
  potentialNextPanel: PanelObj | null;
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
  };
  previous: {
    panel: PanelObj | null;
    snapPoint: SnapPointObj | null;
  };
  panelDirectionCount: number;
  origin: {
    x: number;
    y: number;
    panel: PanelObj | null;
    snapPoint: SnapPointObj | null;
    snapPointIndex: number;
  };

  transform: string;

  boundingPanelIndexes: {
    topLeft: number;
    topRight: number;
    bottomLeft: number;
    bottomRight: number;
  };
  selectedPanels?: PanelObj[];
  allPanels?: PanelObj[];
  panelArrayFullyIterated: boolean;
};

export type PointCorner = 'topleft' | 'topright' | 'bottomleft' | 'bottomright';
