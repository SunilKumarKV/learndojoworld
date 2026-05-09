/* eslint-disable react/prop-types */
import { useLocation } from 'react-router-dom';

function PageTransition({ children }) {
  const location = useLocation();

  return (
    <div key={location.pathname} className="animate-page-enter">
      {children}
    </div>
  );
}

export default PageTransition;
