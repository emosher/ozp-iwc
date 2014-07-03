var client = new ozpIwc.Client({peerUrl: "http://" + window.location.hostname + ":15006"});

client.on("connected", function () {
    console.log('connected on: http://' + window.location.hostname + ':15006');
    var config = {};
    config.type = "text/plain";
    config.action = "view";
    config.icon = "http://example.com/view-text-plain.png";
    config.label = "View Plain Text";
    config.invokeIntent = "system.api/application/123-412";

    client.send({
        dst: 'intents.api',
        contentType: 'a',
        action: 'register',
        resource: '/1/2/3',
        entity: config
    }, function (reply) {
        console.log(reply)
    });

    client.send({
        dst: 'intents.api',
        contentType: 'a',
        action: 'register',
        resource: '/1/2/3',
        entity: config
    }, function (reply) {
        console.log(reply)
    });

    // This is a temporary action to check ozpIwc.intentsApi.data will remove.
    client.send({
        dst: 'intents.api',
        contentType: 'a',
        resource: '/1/2',
        action: 'debug'
    }, function (reply) {
        console.log(reply)
    });
});