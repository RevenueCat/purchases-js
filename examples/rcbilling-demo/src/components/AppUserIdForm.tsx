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
    <div className="appUserIdForm">
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
