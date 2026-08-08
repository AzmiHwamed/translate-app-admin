import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { logout } from '../../features/auth/authSlice';

export function Topbar() {
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login', { replace: true });
  };

  return (
    <header className="topbar">
      <div className="topbar__spacer" />
      <div className="topbar__user">
        {user?.photoURL ? (
          <img className="topbar__avatar" src={user.photoURL} alt={user.displayName} />
        ) : (
          <div className="topbar__avatar topbar__avatar--fallback">
            {user?.displayName?.[0] ?? '?'}
          </div>
        )}
        <div className="topbar__user-meta">
          <span className="topbar__user-name">{user?.displayName ?? 'Unknown'}</span>
          <span className="topbar__user-role">{user?.role ?? ''}</span>
        </div>
        <button className="topbar__logout" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </header>
  );
}
