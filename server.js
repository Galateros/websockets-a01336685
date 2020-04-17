// Imports
const express = require('express');
const webRoutes = require('./routes/web');

// Session imports
let cookieParser = require('cookie-parser');
let session = require('express-session');
let flash = require('express-flash');
let passport = require('passport');

// Express app creation
const app = express();

//Socket.io
const server = require('http').Server(app);
const io = require('socket.io')(server);


// Configurations
const appConfig = require('./configs/app');

// View engine configs
const exphbs = require('express-handlebars');
const hbshelpers = require("handlebars-helpers");
const multihelpers = hbshelpers();
const extNameHbs = 'hbs';
const hbs = exphbs.create({
  extname: extNameHbs,
  helpers: multihelpers
});
app.engine(extNameHbs, hbs.engine);
app.set('view engine', extNameHbs);

// Session configurations
let sessionStore = new session.MemoryStore;
app.use(cookieParser());
app.use(session({
  cookie: { maxAge: 60000 },
  store: sessionStore,
  saveUninitialized: true,
  resave: 'true',
  secret: appConfig.secret
}));
app.use(flash());

// Configuraciones de passport
require('./configs/passport');
app.use(passport.initialize());
app.use(passport.session());

// Receive parameters from the Form requests
app.use(express.urlencoded({ extended: true }))

// Routes
app.use('/', express.static(__dirname + '/public'));
app.use('/', webRoutes);

let activeGame = false;
let activePlayers = 0; //EDIT HERE EVENTUALLY
let ans = [{char: "No One",pokemon: "", name: "",monster: ""}]  

io.on('disconnect', (socket) =>{
  console.log("Client Disconnected");
})

let letter = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z']
let activeLetter = '';

let playerName = [{name: 'generic name 1', used: false}, {name: 'generic name 2', used: false}, {name: 'generic name 3', used: false}, {name: 'generic name 4', used: false}, {name: 'generic name 5', used: false}];

io.on('connection', (socket) => {

  console.log('Client connected ' + io.engine.clientsCount);
  socket.emit('toast', {message: "Conectado con el servidor"});
  let i = 0;
  setInterval(() => {
    socket.emit('toast', {message: "Conectado con el servidor"});
    i++;
  }, 10000)
  socket.on('message-to-server', (data) => {
    console.log('message received', data);
  });
  let timeout = null;
  let time = 10;



  socket.on('answer', (data) =>{
    let maxScoreHolder = "";
    let maxScore = -1;

    console.log("Answer: ", data);
    
    ans.push(data);
    for (var i = ans.length - 1; i >= 0; i--) {
      let score = 0;
      let pokescore = 100;
      let namescore = 100;
      let monsterscore = 100;
      if (ans[i].pokemon == "") {
        pokescore = 0;
      }
      if (ans[i].name == "") {
        namescore = 0;
      }
      if (ans[i].monster == "") {
        monsterscore = 0
      }
      
        let pokemon = Array.from(ans[i].pokemon);
        let name = Array.from(ans[i].name);
        let monster = Array.from(ans[i].monster);
        console.log("poke: " + pokemon+" name: "+name+" monster: "+monster);
        for (var j = ans.length - 1; j >= 0; j--) {
          //console.log("is "+ans[j].pokemon+" equal to "+ans[i].pokemon)
          if (pokemon[0] != activeLetter) {
            pokescore = 0;
          }
          if (name[0] != activeLetter) {
            namescore = 0;
          }
          if (monster[0] != activeLetter) {
            monsterscore = 0;
          }
          if (ans[j].pokemon == ans[i].pokemon) {
            console.log("Comparing PokeScore of "+ans[j].char+ " to "+ans[i].char)
            if (ans[j].char != ans[i].char) {
              
              pokescore = pokescore/2;
              console.log("Score div on pokemon "+pokescore);
            }
            
          }
          if (ans[j].monster == ans[i].monster) {
              if (ans[j].char != ans[i].char) {
              
              monsterscore = monsterscore/2;
              console.log("Score div on monster "+monsterscore);
            }
          }
          if (ans[j].name == ans[i].name) {
              if (ans[j].char != ans[i].char) {
              
              namescore = namescore/2;
              console.log("Score div on name "+namescore);
            }
          }
        }
        score = pokescore + namescore + monsterscore;
        console.log("Final Score of "+ ans[i].char+ " "+score)
        if (score > maxScore) {
          maxScoreHolder = ans[i].char;
          maxScore = score
          console.log("New MaxScore " + maxScore+ " By "+maxScoreHolder)
        }

    }
    activePlayers = 0;
    io.emit('anounce-winner',{maxScore: maxScore, maxScoreHolder: maxScoreHolder})
  })


  socket.on('stop-game', () => {
    timeout = setInterval(() =>{
      io.emit('timeout',{time: time})
      console.log("Timeout in "+time);
      time--;
      if (time == 0) {
        clearInterval(timeout);
        activeGame = false;
        io.emit('end-game')
      }
    },1000)

  })
  socket.on('need-name',() =>{
    let randName = Math.floor(Math.random()*playerName.length);
    socket.emit('get-player-name',{char: playerName[randName].name})
  })
  socket.on('player-ready',() =>{

    activePlayers++;
    console.log("Player ready "+activePlayers);
    
    //socket.emit('player-name',{playerName: playerName[randName].name }) // ASSIGN NAME HERE
    if (activePlayers > 1 && !activeGame) {
    activeGame = true;
    console.log("GameStart");
    let rand = Math.floor(Math.random()*26);
    activeLetter = letter[rand];
    let startIn = 10;
    timeStart = setInterval(() =>{
      startIn--;
      io.emit('start-in',{time: startIn});
      if (startIn <= 0) {
        io.emit('gameStart',{letter: letter[rand]})
        clearInterval(timeStart)
      }
    },1000)

    
    
  }
  })

  

});

// App init
server.listen(appConfig.expressPort, () => {
  console.log(`Server is listenning on ${appConfig.expressPort}! (http://localhost:${appConfig.expressPort})`);
});
