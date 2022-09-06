const net = require('net')

const PORT = parseInt(process.argv[2])
const ROOT_ADDRESS = '::ffff:127.0.0.1';
const ROOT_PORT = 9001;

let peers = [{address: ROOT_ADDRESS, port: ROOT_PORT}] //this is previously connected sockets

//CLIENT PART
let socket = net.connect(ROOT_PORT, ROOT_ADDRESS,()=>{
    sendMessage(socket, {type:'port', port:PORT})

    socket.on('data', data =>{
        const message = JSON.parse(data.toString());
        switch(message.type){
            case 'peers':
                peers = addMissingPeers(peers, message.peers)
                peers.forEach(peer => {
                    //becouse you are already connected to root server
                    if (peer.address == ROOT_ADDRESS && peer.port == ROOT_PORT) return;
                    
                    connectToPeer(peer)
                })
                break;
            case 'message':
                console.log(message.message);
                break;
        }
    })

    process.stdin.on('data', data=>{
        sendMessage(socket, {type:'message', message: data})
    })
})

function addMissingPeers(oldPeers ,newPeers){
    for(const newPeer of newPeers){
        if(oldPeers.some(peer => newPeer.address == peer.address && newPeer.port == peer.port)) continue;

        oldPeers.push(newPeer)
    }
    return oldPeers
}

function connectToPeer(peer){
    console.log('Connecting to client',peer.port)
    let socket = net.connect(peer.port, peer.address,()=>{
        socket.on('data', data => {
            const message = JSON.parse(data.toString());
            switch (message.type) {
                case 'message':
                    console.log(message.message);
                    break;
            }
        })

        sendMessage(socket, {type:'peer-port', port: PORT})

        process.stdin.on('data', data=>{
            sendMessage(socket, {type:'message', message: data})
        })
    })
}

//SERVER PART
const server = net.createServer(function (socket){//this is currently connected socket
    console.log('Client connected')

    socket.on('data',data=>{

        const message = JSON.parse(data.toString());
        switch(message.type){
            case 'port':
                sendMessage(socket, {type:'peers', peers})
                peers = addMissingPeers(peers, [{address: socket.remoteAddress, port: message.port}])
                break;
            case 'peer-port':
                peers = addMissingPeers(peers, [{address: socket.remoteAddress, port: message.port}])
                break;
            case 'message':
                console.log(message.message);
                break;
        }
    })

    process.stdin.on('data', data=>{
        sendMessage(socket, {type:'message', message: data})
    })
})

function sendMessage(socket, message){
    socket.write(JSON.stringify(message));
}

server.listen(PORT)