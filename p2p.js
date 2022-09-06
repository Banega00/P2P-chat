const net = require('net')

const PORT = parseInt(process.argv[2])
const ROOT_ADDRESS = '::ffff:127.0.0.1';
const ROOT_PORT = 9001;

const randomString = (len=10) => {
    return Math.random().toString(36).substring(2, len + 2);
}

const rootPeer = {address: ROOT_ADDRESS, port: ROOT_PORT}

let peers = [rootPeer] //this is previously connected sockets

//CLIENT PART
let socket = net.connect(ROOT_PORT, ROOT_ADDRESS,()=>{
    sendMessage(socket, {type:'port', port:PORT})
    socket.id = randomString(10);
    rootPeer.id = socket.id
    socket.on('data', data =>{
        const message = JSON.parse(data.toString());
        switch(message.type){
            case 'peers':
                peers = addMissingPeers(peers, message.peers);
                peers.forEach(peer => {
                    //because you are already connected to root server
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
        if(socket.destroyed) return;
        sendMessage(socket, {type:'message', message: data.toString()})
    })

    socket.on('close', ()=>{
        console.log("Removing", socket.id)
        peers = peers.filter(peer => peer.id != socket.id)
        console.log(peers.map(peer=>{
            return {id: peer.id, port: peer.port}
        }));
        socket.destroy()
    })
})

function addMissingPeers(oldPeers ,newPeers){
    for(const newPeer of newPeers){
        if(oldPeers.some(peer => peer.address == newPeer.address && peer.port == newPeer.port)) continue;

        oldPeers.push(newPeer)
    }
    return oldPeers
}

function connectToPeer(peer){
    console.log('Connecting to client',peer.port)
    let socket = net.connect(peer.port, peer.address,()=>{
        socket.id = randomString(10);
        peer.id = socket.id;
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
            if(socket.destroyed) return;

            sendMessage(socket, {type:'message', message: data.toString()})
        })

        socket.on('close', ()=>{
            console.log("Removing", socket.id)
            peers = peers.filter(peer => peer.id != socket.id)
            console.log(peers.map(peer=>peer.port));
            socket.destroy()
        })
    })
}

//SERVER PART
const server = net.createServer(function (socket){//this is currently connected socket
    socket.id = randomString(10);
    console.log('Client connected',socket.id)

    socket.on('data', data=>{

        const message = JSON.parse(data.toString());
        switch(message.type){
            case 'port':
                sendMessage(socket, {type:'peers', peers})
                peers = addMissingPeers(peers, [{id: socket.id, address: socket.remoteAddress, port: message.port}])
                break;
            case 'peer-port':
                peers = addMissingPeers(peers, [{id: socket.id, address: socket.remoteAddress, port: message.port}])
                break;
            case 'message':
                console.log(message.message);
                break;
        }
    })

    process.stdin.on('data', data =>{
        if(socket.destroyed) return;

        sendMessage(socket, {type:'message', message: data.toString()})
    })

    socket.on('close', ()=>{
        console.log("Removing",socket.id)
        peers = peers.filter(peer => peer.id != socket.id)
        console.log(peers.map(peer=>peer.port));
        socket.destroy()
    })
})

function sendMessage(socket, message){
    socket.write(JSON.stringify(message))
}

server.listen(PORT)