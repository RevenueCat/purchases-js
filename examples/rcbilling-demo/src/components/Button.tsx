import React from "react";

const Button: React.FC<{ caption: string; onClick: () => void }> = ({
  caption,
  onClick,
}) => {
  return (
    <button className="button" onClick={onClick}>
      {caption}
    </button>
  );
};

export default Button;
