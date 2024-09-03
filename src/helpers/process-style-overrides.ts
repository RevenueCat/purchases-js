export const getStyleVariable = ({
  property,
  variableName,
  fallbackVariableName,
}: {
  property: string | undefined;
  variableName: string;
  fallbackVariableName: string;
}) => {
  return `--${variableName}: ${property || `var(${fallbackVariableName})`}`;
};
