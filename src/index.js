import { Engine } from "@babylonjs/core";
import Game from "./game";


let engine;
let canvas;
let game;

window.onload = () => {
    canvas = document.getElementById("renderCanvas");
    engine = new Engine(canvas, true);
    window.addEventListener("resize", function () {
        engine.resize();
    });

    game = new Game(engine, canvas);
    game.start();
}


