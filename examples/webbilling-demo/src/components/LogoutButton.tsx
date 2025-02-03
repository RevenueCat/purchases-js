import { useNavigate } from "react-router-dom";

const LogoutButton = () => {
  const navigate = useNavigate();
  return (
    <button className="logoutButton" onClick={() => navigate("/logout")}>
      Logout
    </button>
  );
};

export default LogoutButton;
