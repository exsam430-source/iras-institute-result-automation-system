import useAuth from '../../hooks/useAuth';

const RoleGuard = ({ roles, children, fallback = null }) => {
  const { user } = useAuth();

  if (!user || !roles.includes(user.role)) {
    return fallback;
  }

  return children;
};

export default RoleGuard;