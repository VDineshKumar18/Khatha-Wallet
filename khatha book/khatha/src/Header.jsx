function Header({ loggedIn, onLoginClick, onLogout }) {
  return (
    <div className="header">
      <h2>Khatha Book</h2>

      {loggedIn ? (
        <button onClick={onLogout}>Logout</button>
      ) : (
        <button onClick={onLoginClick}>Login</button>
      )}
    </div>
  );
}

export default Header;
