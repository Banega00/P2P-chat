const net = require('net')

const PORT = 3001;

let socket = net.connect(9000,'localhost',()=>{
    sendMessage(socket, {type:'port', port:PORT})
});

function sendMessage(socket, message){
    socket.write(JSON.stringify(message));
}

// socket.on('data', data=>{
//     console.log(data.toString());
// })

// process.stdin.on('data', data =>{
//     socket.write(data)
// })