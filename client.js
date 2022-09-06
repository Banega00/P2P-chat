const net = require('net')


let socket = net.connect(9000,'localhost');

socket.on('data', data=>{
    console.log(data.toString());
})

process.stdin.on('data', data =>{
    socket.write('data')
})