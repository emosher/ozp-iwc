##Launching an Application Through the System API
Applications have the possibility to launch other applications in the IWC. Rather than just opening a link in a new tab,
the System API can be used to pass important information to the launching application much like how Android allows
passing serialized data to new activities.

To launch an application, simply call the `launch` action on the corresponding resource.

```
var systemApi = client.system();

systemApi.launch("/application/ea0c6018-4f12-410d-93b7-fe925b3a6ca2");
```

To launch an application with data passed to it:
```
var data = {
    "Hello": "world!"
};
systemApi.launch("/application/ea0c6018-4f12-410d-93b7-fe925b3a6ca2",{entity: data});
```

The launched application can gather the launch data after it's client has connected as so:
```
var launchParams = {};
client.connect().then(function(){
    launchParams = client.launchParams;
});
```