import React from 'react';
import logo from './logo.svg';
import './App.css';
import './stylesheet.css'
import {Howl, Howler} from 'howler'
const ownName = "me"
let meProperties;
let players =[]
const Player = ({app}) => {
  let me = app.state.positions.me
  return (
    <div className="player" id="player" style={{top: me.offset_top+"px", left: me.offset_left+"px", transform: `rotateZ(${me.rotation}deg)`}}>
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
//test
class App extends React.Component {
  constructor(props) {
    super(props)
    this.state={
      mouseX:0,
      mouseY:0,
      pressedKeys: [],
      update: 0,
      shots: [],
      players: [],
      positions: {
        me: {
          offset_left: 500,
          offset_top: 500,
          rotation: 30
        }
      }
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
    let audio = new Howl ({
      src:['gunshot_1.mp3']
    })
    audio.play()
    let shots = this.state.shots
    let startingPoint = document.getElementById("shot").getBoundingClientRect();
    let shot = {
      currentX: startingPoint.x, 
      currentY: startingPoint.y, 
      ratio: Math.abs(Math.tan(((this.state.positions.me.rotation-90)/180)*Math.PI)),
      xDirection: 1,
      yDirection: 1
    }
    if (this.state.mouseX-startingPoint.x<0) {
      shot.xDirection = -1
    }
    if (this.state.mouseY-startingPoint.y<0) {
      shot.yDirection=-1
    }
    shots.push(shot)
    this.setState({
      shots: shots
    })
  }
  renderShots() {
    let shots = this.state.shots.map((shot) => {
      return (<div className="shot" key={shot.currentX} style={{
        position: "absolute",
        left: shot.currentX,
        top: shot.currentY
      }}></div>)
    })
    return shots
  }















  componentDidMount() {
      meProperties = {
      name: ownName,
      offset_left: 500,
      offset_top: 500,
      rotation: 0,
      health: 100
    }

    fetch("/players", {
      headers: {'Content-Type': 'application/json'},
      method: "post",
      body: JSON.stringify(meProperties)
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
      let getPromise = fetch("/players", {
        method: "get"
      }).then((response) => {return response.json()})
      .then(data => {
        players = data
      })
      let filteredPlayers=players.filter(player => player.name===ownName)[0]
      if (filteredPlayers!==undefined) {
        meProperties=filteredPlayers
      }

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
      let x = this.state.mouseX-this.state.positions.me.offset_left-0.5*parseInt(elemWidth);
      let y = this.state.mouseY-this.state.positions.me.offset_top-0.5*parseInt(elemWidth)
      let rotation = (Math.atan2(y, x)/Math.PI)*180+90
      meProperties.rotation=rotation
      let oldMe=this.state.positions.me
      oldMe["rotation"]=rotation
      let oldPositions=this.state.positions
      oldPositions["me"]=oldMe

      this.state.pressedKeys.forEach(key => {
        if (Object.keys(map).includes(key) && this.state.positions.me[map[key][0]]+map[key][1]>=-20) {
          meProperties[map[key][0]]+=map[key][1]
          oldMe[map[key][0]]+=map[key][1]
          meProperties[map[key][0]]+=map[key][1]
        }
      });
      console.log(meProperties.offset_left)
      fetch("/players", {
        headers: {'Content-Type': 'application/json'},
        method: "put",
        body: JSON.stringify(meProperties)
      })
      this.setState({
        positions: oldPositions,
        shots: newShots,
        players: players
      })
    }, 100)
  }








  logOut() {

    fetch("/players", {
      headers: {'Content-Type': 'application/json'}, 
      method:"delete",
      body: JSON.stringify({name: ownName})})
  }

  render() {
    window.onkeyup = (e) => this.handleKeyRelease(e)
    window.onkeydown = (e) => this.handleKeyPress(e)
    window.onmousemove= (e) => this.handleMouseMove(e)
    window.onbeforeunload= () => this.logOut()
    window.onclick=  this.handleClick.bind(this)
    let shots = this.renderShots()
    return (
      <div className="App">
      <Player app={this}/>
      {shots}
      </div>
    )
  }
}

export default App;
