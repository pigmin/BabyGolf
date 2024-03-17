import { AssetsManager, Sound } from '@babylonjs/core';
import { GlobalManager } from './globalmanager';

import music1Url from "../assets/musics/Sakura-Girl-Daisy-chosic.com_.mp3";


class SoundManager {

    Musics = Object.freeze({

        GAME_MUSIC: 1,
        GAME_OVER_MUSIC: 2,
        //....
    });

    musics = [];
    sounds = [];

    previousMusic;

    static get instance() {
        return (globalThis[Symbol.for(`PF_${SoundManager.name}`)] || new this());
    }
    
    constructor() {
        this.previousMusic = -1;
    }

    async init() {
        return this.loadAssets();
    }

    update() {

    }

    playMusic(musicId) {
        if (this.previousMusic != -1) {
            this.musics[this.previousMusic].stop();
            this.previousMusic = -1;
        }
        if (this.musics[musicId]) {
            this.musics[musicId].play();
            this.previousMusic = musicId
        }
        return (this.previousMusic != -1);
    }

    playSound(soundId, bLoop) {
        if (this.sounds[soundId]) {
            //TODO : updateOptions ?
            this.sounds[soundId].play();
        }
    }

    async loadAssets() {
        return new Promise((resolve, reject) => {
    
          // Asset manager for loading texture and particle system
          let assetsManager = new AssetsManager(GlobalManager.scene);
    
          const music1Data = assetsManager.addBinaryFileTask("music1", music1Url);
    
          //const whistleSoundData = assetsManager.addBinaryFileTask("fireSound", whistleSoundUrl);
    
          // after all tasks done, set up particle system
          assetsManager.onFinish = (tasks) => {
            console.log("tasks successful", tasks);
    
            this.musics[this.Musics.GAME_MUSIC] = new Sound("music1", music1Data.data, GlobalManager.scene, undefined, { loop: true, autoplay: false, volume: 0.05 });
    
            //this.soundsFX[this.SoundsFX.WHISTLE] = new Sound("whistle", whistleSoundData.data, GlobalManager.scene);
    
            resolve(true);
          }
    
          assetsManager.onError = (task, message, exception) => {
            console.log(task, message, exception);
            reject(false);
          }
    
    
          // load all tasks
          assetsManager.load();
    
        });
    
    
      }
}

const { instance } = SoundManager;
export { instance as SoundManager };