import React from 'react';
import logo from './logo.svg';
import './App.css';
import './stylesheet.css'
import {Howl, Howler} from 'howler'
import io from 'socket.io-client'
const socket = io("http://localhost:5000")


const ownName = JSON.stringify(Math.floor(Math.random()*1000))
//test
const Player = ({player}) => {
  return (
    <div className="player" id="player" style={{top: player.offset_top+"px", left: player.offset_left+"px", transform: `rotateZ(${player.rotation}deg)`}}>
  <div className="pipe">
  <div className="shot-entry-point" id="shot"></div>
  </div>
  <div className="player-shoulders">
  <div className="player-head"></div>
  </div>
  <div className="player-hands">
  <div className="player-hand right-hand"></div>
  <div className="player-hand left-hand"></div>
  </div>
  </div>)
}

class App extends React.Component {
  constructor(props) {
    super(props)
    this.state={
      mouseX:0,
      mouseY:0,
      pressedKeys: [],
      update: 0,
      shots: [],
      players: [{name: ownName, offset_left: 500, offset_top: 500, rotation: 0, health:100}]
    }
  }
  handleKeyPress(e) {
    if(!this.state.pressedKeys.includes(e.key)) {
      let arrProto = this.state.pressedKeys
      arrProto.push(e.key)
      this.setState({
        pressedKeys: arrProto
      })
    }
  }
  handleKeyRelease(e) {
    let arrProto=this.state.pressedKeys;
    let newArr = arrProto.filter(key => key!==e.key)
    this.setState({
      pressedKeys: newArr
    })
  }
  handleMouseMove(e) {
    this.setState({
      mouseX: e.clientX,
      mouseY: e.clientY
    })
  }
  handleClick() {
    let me = this.state.players.filter(player=>player.name===ownName)[0]
    let audio = new Howl ({
      src:['gunshot_1.mp3']
    })
    audio.play()
    let startingPoint = document.getElementById("shot").getBoundingClientRect();
    let shot = {
      currentX: startingPoint.x, 
      currentY: startingPoint.y, 
      ratio: Math.abs(Math.tan(((me.rotation-90)/180)*Math.PI)),
      xDirection: 1,
      yDirection: 1
    }
    if (this.state.mouseX-startingPoint.x<0) {
      shot.xDirection = -1
    }
    if (this.state.mouseY-startingPoint.y<0) {
      shot.yDirection=-1
    }
    socket.emit("shoot", shot)
  }
  renderShots() {
    let shots = this.state.shots.map((shot) => {
      return (<div className="shot" key={Math.floor(Math.random()*100000)} style={{
        position: "absolute",
        left: shot.currentX,
        top: shot.currentY
      }}></div>)
    })
    return shots
  }

  componentDidMount() {
    socket.on("player", (data) => {
      let newPlayers = this.state.players
      if (newPlayers.some(item => item.name===data.name)){
        let index = newPlayers.findIndex(player => player.name===data.name)
        newPlayers[index]=data
      } else {
        newPlayers.push(data)
      }
      this.setState({
        players: newPlayers
      })
    })
    socket.on("shoot", (data) => {
      let oldShots = this.state.shots
      oldShots.push(data)
      this.setState({
        shots: oldShots
      })
    })
    
    let backgroundMusic = new Howl({
      src: ["background_music_1.mp3"],
      volume: 0.1,
      loop: true
    })

    let map = {
      "w": ["offset_top", -5],
      "a": ["offset_left", -5],
      "s": ["offset_top", 5],
      "d": ["offset_left", 5]
    }
    let elem = document.getElementById("player")
    let elemWidth = getComputedStyle(elem).width

    let game = window.setInterval(() => {

      let currentMe = this.state.players.filter((player) => player.name===ownName)[0]

      let shots = this.state.shots.filter((shot) => {
        let x = shot.currentX
        let y = shot.currentY
        return (x<window.innerWidth&&x>=0 && y>0 &&y>0 && y<window.innerHeight)
      })
      let newShots = shots.map((shot) => {
        /*tangent is very high when aiming directly up (limit to infinity). 
        this caused shots to travel faster directly up. multiplier fixes this problem. */
        let multiplier = Math.sqrt(shot.ratio**2+1)/(shot.ratio**2+1)

        shot.currentX+=multiplier*shot.xDirection*15
        shot.currentY+=multiplier*shot.ratio*shot.yDirection*15
        return shot
      })
      //rotation setting starts
      let x = this.state.mouseX-currentMe.offset_left-0.5*parseInt(elemWidth);
      let y = this.state.mouseY-currentMe.offset_top-0.5*parseInt(elemWidth)
      let rotation = (Math.atan2(y, x)/Math.PI)*180+90
      currentMe.rotation=rotation

      this.state.pressedKeys.forEach(key => {

        if (Object.keys(map).includes(key) && currentMe[map[key][0]]+map[key][1]>=-20) {
          currentMe[map[key][0]]+=map[key][1]
        }
      });
      let newPlayers=this.state.players
      let index=this.state.players.findIndex(element => element.name===ownName)
      newPlayers[index]=currentMe
      socket.emit("player", currentMe)
      this.setState({
        shots:newShots
      })
    }, 1000/50)
  }
  renderPlayers() {
    let res = this.state.players.map(player => {
      return <Player player={player}/>
    })
    return res
  }
  logOut() {
  }
  render() {
    window.onkeyup = (e) => this.handleKeyRelease(e)
    window.onkeydown = (e) => this.handleKeyPress(e)
    window.onmousemove= (e) => this.handleMouseMove(e)
    window.onclick=  this.handleClick.bind(this)
    let shots = this.renderShots()
    let players = this.renderPlayers()
    return (
      <div className="App">
      {players}
      {shots}
      </div>
    )
  }
}

export default App;
