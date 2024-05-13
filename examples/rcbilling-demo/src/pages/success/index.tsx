import React from "react";
import AppStoreButton from "../../components/AppStoreButton";
import PlayStoreButton from "../../components/PlayStoreButton";
import AppLogo from "../../components/AppLogo";
import LogoutButton from "../../components/LogoutButton";

const SuccessPage: React.FC = () => {
  // const onNextClicked = () => {
  //   window.location.replace("/");
  // };

  return (
    <>
      <LogoutButton />
      <div className="success">
        <AppLogo />
        <h1>Enjoy your premium experience.</h1>
        <h2>
          Now log in to the app to start using your new premium subscription.
        </h2>
        <div className="storeButtons">
          <AppStoreButton />
          <PlayStoreButton />
        </div>
      </div>
    </>
  );
};

export default SuccessPage;
