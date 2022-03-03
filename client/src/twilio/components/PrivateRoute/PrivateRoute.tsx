import React from 'react';
import { Redirect, Route, RouteProps } from 'react-router-dom';
import { useAppState } from '../../state';

export default function PrivateRoute({ children, ...rest }: RouteProps) {
  const { isAuthReady, user } = useAppState();

  const renderChildren = user || !process.env.REACT_APP_SET_AUTH;
  if (!renderChildren && !isAuthReady) {
    return null;
  }

  return (
    <Route
      {...rest}
      render={({ location }) =>
        renderChildren ? (
          children
        ) : (
            <Redirect
              to={{
                pathname: `/login`,
                search: `?redirectURI=${encodeURIComponent(window.location.pathname + window.location.search)}`,
                state: { from: location },
              }}
            />
          )
      }
    />
  );
}
