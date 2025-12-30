import React from "react";
import "./style.css";
import { Link } from "react-router-dom";

const StartPage = () => {
    return (
        <div className="root">
            <header className="header"></header>
            <div className="StartPage">
                <Link to="/menu" style={{ textDecoration: 'none' }}>
                    <button className="play">PLAY!</button>
                </Link>
            </div>
        </div>
    );
};

export default StartPage;
