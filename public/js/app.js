function showToast(msg) {
    console.log("El mensaje es: ", msg);
    $.toast({
        text: msg,
        position: "top-right"
    })
}
let char = ""
let letter = ""
let timeout = false;
window.socket = null;
let ready = false;
let onGame = false;
function connectToSocketio() {
    let server = window.location.protocol + "//" + window.location.host;
    window.socket = io.connect(server);

    window.socket.on('toast', function(data){
        showToast(data.message);
    })
    window.socket.on('get-player-name',function(data){
        char = data.char;
        console.log("name "+data.char);
        document.getElementById('char').innerHTML = "Nombre de Jugador: "+data.char;
    })
    window.socket.on('gameStart',function(data){
        if (ready) {
            onGame = true;
            document.getElementById('wait-to-start').style.display = "none";
            letter = data.letter;
            console.log(data.letter);
            window.socket.emit('need-name');
            document.getElementById('letter').innerHTML = "La letra del juego es: "+data.letter;
            document.getElementById('game-form').style.display = "block";
        }
        

        //document.getElementById()
    })
    
    window.socket.on('timeout', function(data){
        if (onGame) {
            timeout = true;
            showToast("Juego Termina en: "+data.time);
        }
        
    })
    //var clients = io.clients();
    //showToast(clients);

    window.socket.on('end-game', function(data){
        if (onGame) {
            name = document.getElementById('name').value;
            pokemon = document.getElementById('pokemon').value;
            monster = document.getElementById('monster').value;
            window.socket.emit('answer',{char: char, name: name, pokemon: pokemon, monster: monster} )
            document.getElementById('game-form').style.display = "none";
            timeout = false;
            showToast("GameEnded");
        }
        
    })
    window.socket.on("anounce-winner",function(data){
        if (onGame) {
            document.getElementById('winner-screen').style.display = "block"
            document.getElementById('win-player').innerHTML = "El ganador es: "+data.maxScoreHolder;
            document.getElementById('win-score').innerHTML = "Con puntuacion de: "+data.maxScore;
            document.getElementById('unready').style.display = "block"
            ready = false;
            onGame = false;
        }
        
    })
    window.socket.on('start-in',function(data){
        showToast("El Juego Empieza En: "+data.time)
    })
    
}

function playerReady(){
    ready = true;
    window.socket.emit('player-ready');
    document.getElementById('unready').style.display = "none";
    document.getElementById('winner-screen').style.display = "none";
    document.getElementById('wait-to-start').style.display = "block";
    //document.getElementById('anounce-winner').style.display = "none";
}
function sendAnswers(){
    if (!timeout) {
        window.socket.emit('stop-game')
    }
    

    window.socket.emit('message-to-server',{message: "Ending Game"})
}
function messageToServer(msg) {
    window.socket.emit('message-to-server', {message: msg});
}

$(function () {
    connectToSocketio();
})