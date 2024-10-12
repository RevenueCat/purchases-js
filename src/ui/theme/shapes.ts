export interface Shape {
  "input-border-radius": string;
  "input-button-border-radius": string;
  "modal-border-radius": string;
}

export const RoundedShape: Shape = {
  "input-border-radius": "12px",
  "input-button-border-radius": "12px",
  "modal-border-radius": "16px",
};

export const RectangularShape: Shape = {
  "input-border-radius": "0px",
  "input-button-border-radius": "0px",
  "modal-border-radius": "0px",
};

export const PillsShape: Shape = {
  "input-border-radius": "24px",
  "input-button-border-radius": "56px",
  "modal-border-radius": "16px",
};

export const DefaultShape = RoundedShape;
