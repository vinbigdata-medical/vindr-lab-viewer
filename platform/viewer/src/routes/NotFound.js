import React from 'react';
import './NotFound.css';
import { BASE_ROUTER_DASHBOARD_PREFIX } from '../constants/constants';

export default function NotFound({
  message = 'Sorry, this page does not exist.',
  showGoBackButton = true,
}) {
  const gotoHome = () => {
    window.location.href = window.origin + BASE_ROUTER_DASHBOARD_PREFIX;
  };

  return (
    <div className={'not-found'}>
      <div>
        <h4>{message}</h4>
        {showGoBackButton && (
          <h5>
            <div onClick={gotoHome} className="link-to-home">
              Go back to the Home page
            </div>
          </h5>
        )}
      </div>
    </div>
  );
}
