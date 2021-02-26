import React, { useEffect, useState } from "react";
import { List, ListItem, Box, Container, Paper } from "@material-ui/core";
import prendas from "../../data/prendas.json";
import music from "./effect1.ogg";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  useParams,
} from "react-router-dom";
import "./style.css";

const ScorePage = () => {
  const handleOnclick = () => {};
  const [message, setMessage] = useState("");
  const [score, setScore] = useState(0);
  const audio = new Audio(music);

  useEffect(() => {
    audio.play();
    setMessage(prendas[Math.floor(Math.random() * 20)].text);
    scoreGenerate();
  }, []);

  const scoreGenerate = async () => {
    const value = 79 + Math.floor(Math.random() * 20);
    for (let index = 0; index < value; index++) {
      setScore(index);
      await new Promise((r) => setTimeout(r, 50));
    }
  };

  return (
    <div className="score-page">
      <header className={"header"}></header>
      <div className={"score"}>NOTA:{score}</div>
      <div className={"prenda"}>{message}</div>
      <Router forceRefresh={true}>
        <Link to={"menu"}>
          <button className={"play"}>Menu</button>
        </Link>
      </Router>
    </div>
  );
};

export default ScorePage;
