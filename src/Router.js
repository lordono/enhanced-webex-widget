import React from "react";
import { Switch, Route, useLocation } from "react-router-dom";
import App from "./App";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const AppRouter = () => {
  let query = useQuery();
  const onEvent = event => console.log(event);

  return (
    <Switch>
      <Route path="/">
        <App token={query.get("access_token")} onEvent={onEvent} />
      </Route>
    </Switch>
  );
};

export default AppRouter;
