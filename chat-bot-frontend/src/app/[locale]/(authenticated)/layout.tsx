interface AuthenticatedAppLayoutInterface {
  children: React.ReactNode;
}
const AuthenticatedAppLayout: React.FC<AuthenticatedAppLayoutInterface> = ({
  children,
}) => {
  return <div>{children}</div>;
};

export default AuthenticatedAppLayout;
