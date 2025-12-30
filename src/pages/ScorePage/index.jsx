import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import prendas from "../../data/prendas.json";
import music from "../../assets/effect1.ogg";
import "./style.css";

const ScorePage = () => {
    const location = useLocation();
    const finalScore = location.state?.score || 0;

    const [message, setMessage] = useState("");
    const [score, setScore] = useState(0);

    useEffect(() => {
        const audio = new Audio(music);
        audio.play().catch(e => console.log("Audio play failed:", e));

        const randomPrenda = prendas[Math.floor(Math.random() * prendas.length)];
        setMessage(randomPrenda.text);

        scoreGenerate();
    }, []);

    const scoreGenerate = async () => {
        for (let index = 0; index <= finalScore; index++) {
            setScore(index);
            await new Promise((r) => setTimeout(r, 20));
        }
    };

    return (
        <div className="score-page">
            <div className="score-content">
                <div className="score">NOTA: {score}</div>
                <div className="prenda">{message}</div>
                <div className="score-actions">
                    <Link to="/menu">
                        <button className="play">Menu</button>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ScorePage;
