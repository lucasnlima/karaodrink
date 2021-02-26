import React from "react";
import "./style.css";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  useParams,
} from "react-router-dom";

const StartPage = () => {
  return (
    <div className={"root"}>
      <header className={"header"}></header>
      <div className={"StartPage"}>
        <Router forceRefresh={true}>
          <Link to={"menu"}>
            <button className={"play"}>PLAY!</button>
          </Link>
        </Router>
      </div>
    </div>
  );
};

export default StartPage;
