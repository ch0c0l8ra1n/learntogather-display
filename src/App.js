import React,{useEffect,useState} from 'react';
import socketIOClient from "socket.io-client";

const ENDPOINT = "http://192.168.1.73:5001";

const appNames = ["Trivia!","Deja Vu","Tic-Tac-Toe","Get Jammin","Battleships",
                  "Venture Communist","Cake?"];


function App() {
  const [seconds,setSeconds] = useState(0);

  useEffect(() => {
    if (seconds > 0){
      setTimeout(() => setSeconds(seconds-1),1000);
    }
  },[seconds]);

  const [socket,setSocket] = useState(null);
  const [key,setKey] = useState("");
  const [controllers,setControllers] = useState([]);
  const [state,setState] = useState({
    appName: "MainMenu",
    controllers: [],
    appState: {
      selectedAppIndex: 0
    },
    question: {
      title: ""
    }
  })

  const setAppName = (name) => setState(({...oldState}) => ({appName:name,oldState}))
  const setAppState = (appState) => setState(({...oldState}) => ({appState,oldState}))

  useEffect( () => {
    const s = socketIOClient(ENDPOINT);
    setSocket(s);

    s.on("connect", () => {
      console.log("CONNECTED 😃");
      s.emit("createRoom",{})
    });

    s.on("bigScreenUpdate", (data) => {
      console.log("Update!",data);

      const currQuestion = state.appState.question ? state.appState.question.title : "";
      const newQuestion = data.appState.question ? data.appState.question.title : "";
      if (currQuestion != newQuestion){
        console.log("Old question",state.appState.question,"New question",data.appState.question);
        setSeconds(10);
      }
      setState(data);
    

      setKey(data.key);

    });

    s.on("roomCreated", (data) => {
      console.log("ROOM CREATED!",data);
      setKey(data.key);
      //setAppIndex(data.selectedAppIndex);
    });

    s.on("controllersUpdate", (data) => {
      console.log("Controllers update",data);
      setControllers(data.controllers);
    });

    s.on("disconnect",() => {
      console.log("DISCONNECTED 😕");
    });

    s.on("appIndexUpdate",(data) => {
      //setAppIndex(data.selectedAppIndex);
    });

  },[]);

  const getWinner = (scores) => {
    console.log(scores);
    let winner = "";
    let maxScore = 0;
    for (const k of Object.keys(scores)){
      if (scores[k] > maxScore){
        console.log(k,scores[key]);
        maxScore = scores[k];
        winner = k;
      }
    }
    return winner;
  }

  const appsIndices = [0,1,2,3,4,5,6,7,8,9];
  return (
    <div>
      <img src="/togatherlogo.png"
      style={{display: "block", height: "60px", marginBottom: 30,marginTop: 20, marginLeft: "auto", marginRight: "auto"}}/>
      {key ? 
      <div>
        Room Key: {key}
        <div>
          <p>Connected Controllers:</p>
          <ul>
      {state.controllers.map( (controller,i) => <li key={i}><p>{`${controller.name}| Master=${controller.masterStatus}`}</p></li>)}
          </ul>
        </div>
        {state.appName === "MainMenu" ? 
          <div style={{height:"100px"}}>
          {appsIndices.map( (ai, i) => <div key={i} 
            style={{display:"inline",padding:10,width:100,height:100,borderWidth:"2px",borderColor:"red",borderStyle: i === state.appState.selectedAppIndex ? "solid" : ""}}>
                {appNames[i]}
          </div>)}
        </div>:
        <div>
        { state.appName === "Trivia" && state.appState.appStage === "questioning" ? 
        <div style={{height: "400px",width:"600px"}}>
          <h2>{state.appState.question.title}</h2>
          <p>{seconds}</p>
          {state.appState.question.options.map( (opt,i) => <div style={{marginLeft: "20px",marginBottom:"20px"}} key={i}>{opt.text}<span style={{float:"right"}}>{opt.selectedBy.map(p => p.name).join()}</span></div>)}
        </div>
        :  null}
        { state.appName === "Trivia" && state.appState.appStage === "finished" ?
        <div>
          <h2>WINNER {getWinner(state.appState.scores)}</h2>
          <h3>Leader Board: </h3>
          <ol>
            {Object.keys(state.appState.scores).map( (k,i) => <li key={i}><p>{`${k}: ${state.appState.scores[k]}`}</p></li> )}
          </ol>
        </div>
        : null}
        { state.appName === "MemoryGame" && state.appState.appStage === "questioning" ?
        <div style={{marginLeft: "20px"}}>
          <h1>{state.appState.word}</h1>
          <p>Score: {state.appState.score}</p>
        </div>
        : null}
        { state.appName === "MemoryGame" && state.appState.appStage === "lost" ?
        <h2>Game over. Your score: {state.appState.score}</h2>
        : null}
        </div>
        }
      </div>
      :
      <div>
        Hang on!
      </div>}
    </div>
  );
}

export default App;
