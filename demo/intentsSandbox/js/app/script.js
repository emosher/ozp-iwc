
var client=new ozpIwc.Client({peerUrl:"http://" + window.location.hostname + ":13000"});

client.on("connected",function() {
    console.log('connected on: http://' + window.location.hostname + ':13000');
});