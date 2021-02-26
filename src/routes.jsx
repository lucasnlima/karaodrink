import React from "react";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import MenuPage from "./pages/MenuPage";
import ScorePage from "./pages/ScorePage";
import StartPage from "./pages/StartPage";
import VideoPage from "./pages/VideoPage";

const Routes = () => {
  return (
    <Router>
      <Switch>
        <Route path="/" exact component={StartPage} />
        <Route path="/menu" exact component={MenuPage} />
        <Route path="/video/:id" exact component={VideoPage} />
        <Route path="/score" exact component={ScorePage} />
      </Switch>
    </Router>
  );
};

export default Routes;
