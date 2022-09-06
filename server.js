const net = require('net')

const streams = [] //this is previously connected sockets
const server = net.createServer(function (socket){//this is currently connected socket
    console.log('Client connected')

    streams.forEach( otherSocket =>{
        otherSocket.on('data', data => {
            socket.write('data');
        })
        socket.on('data', data => {
            otherSocket.write('data')
        })
    })

    streams.push(socket)
})

server.listen(9000)