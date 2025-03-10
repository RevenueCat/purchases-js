export interface Shape {
  "input-border-radius": string;
  "input-button-border-radius": string;
}

export const RoundedShape: Shape = {
  "input-border-radius": "4px",
  "input-button-border-radius": "8px",
};

export const RectangularShape: Shape = {
  "input-border-radius": "0px",
  "input-button-border-radius": "0px",
};

export const PillsShape: Shape = {
  "input-border-radius": "12px",
  "input-button-border-radius": "9999px",
};

export const DefaultShape = RoundedShape;
