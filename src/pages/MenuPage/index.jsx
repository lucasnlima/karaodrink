import React, { useState } from "react";
import { List, ListItem, Box, Container } from "@material-ui/core";
import songs from "../../data/songs.json";
import { BrowserRouter as Router, Link, useHistory } from "react-router-dom";
import "./style.css";

const MenuPage = () => {
  const history = useHistory();
  const [search, setSearch] = useState("");

  const handleInputChange = (value) => {
    setSearch(value);
  };

  const handleOnclick = () => {
    history.push("/video/" + search);
  };

  return (
    <div>
      <header className={"header"}></header>
      <div className={"container"}>
        <Router forceRefresh={true} basename="video/">
          LISTA DE MÚSICAS
          <div className={"list-container"}>
            <List size={7} className={"MenuPage-list"}>
              {songs.map((song) => {
                return (
                  <Link to={song.id}>
                    <ListItem className={"list-item"} button={true}>
                      {song.name}
                    </ListItem>
                  </Link>
                );
              })}
            </List>
          </div>
        </Router>
        <div>ENTRE COM O CÓDIGO:</div>
        <input onChange={(e) => handleInputChange(e.target.value)}></input>
        <br></br>
        <br></br>
        <button className={"play"} onClick={handleOnclick}>
          BUSCAR
        </button>
      </div>
    </div>
  );
};

export default MenuPage;
