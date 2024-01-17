import React, { useState } from "react";

interface IAppUserIdFormProps {
  currentAppUserId: string;
  onAppUserIdChange: (newValue: string) => void;
}

const AppUserIdForm: React.FC<IAppUserIdFormProps> = ({
  currentAppUserId,
  onAppUserIdChange,
}) => {
  const [appUserId, setAppUserId] = useState(currentAppUserId);

  return (
    <div
      style={{
        background: "black",
        borderTop: "1px solid grey",
        borderRight: "1px solid grey",
        paddingTop: "10px",
        height: "200px",
        position: "fixed",
        bottom: 0,
        left: 0,
        width: "300px",
        fontSize: "24px",
      }}
    >
      <div>App User Id:&nbsp;</div>
      <input
        value={appUserId}
        style={{ fontSize: "18px" }}
        onChange={(ev) => setAppUserId(ev.target.value)}
        type={"text"}
        name={"app-user-id"}
      />
      <br />
      <br />
      <button
        className="button"
        onClick={() => {
          onAppUserIdChange(appUserId);
        }}
      >
        Change
      </button>
    </div>
  );
};

export default AppUserIdForm;
