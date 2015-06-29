##Invoking an Intent
When a widget wants to offload operations to other widgets on the bus, intent invocations are used. Much like
Android intents, a payload is not a requirement to send with the intent but is an added benefit. Intents can be used
for notifications (broadcast to all widgets on the bus), triggering some background operation (shutdown utilities),
offloading common tasks (visualizing data, compiling output files, converting documents), and much more.

To invoke an intent, the `invoke` action is used:
```
var intentsApi = client.intents();
var payload = {
    "Hello": "World!"
};

intentsApi.invoke("/application/view/json",{ entity: payload}).then(function(res){
    // resolves when the intent API receives the request.
});
```

***

###What if there are no handlers?
If there are no handlers open for the desired intent invocation, the invoke promise will reject with a response of 
"noResource". At current state of the platform, launching a registered application to handle an intent invocation has
not been implemented. 

It is planned to replace the promise rejection with giving the user a choice of registered applications to launch to 
handle the desired invocation.

###What if there is more than one handler?
If more than one handler is available, the user is prompted with an "intent chooser" that allows a decision to be made
by the user for which handler (widget) should accept the invocation.

User preferences on intent handlers is currently in development. The user will be able to save handler choices so that
they do not use an "intent chooser" unless the IWC can't find a preference.

###What if I want to have all handlers accept my invocation?
Using the `broadcast` action, all handlers will accept the intent invocation and process it:
To invoke an intent, the `invoke` action is used:
```
var intentsApi = client.intents();
var payload = {
    "Hello": "World!"
};

intentsApi.broadcast("/application/view/json",{ entity: payload});
```
