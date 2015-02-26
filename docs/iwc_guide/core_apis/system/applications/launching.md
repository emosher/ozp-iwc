##Launching applications from the System API

The System API has a unique action called `launch`. This action only applies to application resources
(`/application/${application's UUID}`) in the System API.

***

To launch an application, a **launch** action is used on  `/application/${application's UUID}` resource in the
System API. The full list of resource names can be gathered via a **get** on `/application`.

The entity of the **launch** action, `launchParams` is a JSON object of parameters that will be serialized and passed
to the launching application once it opens. As this is a JSON object, functions are not valid JSON and will not be passed.

```
var systemApi = client.system();
var launchParams = {
    'theme': 'dark',
    'color': 'blue'
}

systemApi.launch('/application/2d48539d-c787-4dd6-be4c-5a0fb0086ff4',launchParams);
```

#WIP Needs revision and example code testing


In this example, the `launchUrl` of the desired application (stored in resource
'/application/2d48539d-c787-4dd6-be4c-5a0fb0086ff4') is gathered, and the `launchParams` properties are sent to the
Intents API to be obtained by the opening application.

Upon the opening application's IWC client [connection](../../../getting_started/connecting.md), the values of `launchParams` are available as so:

####Opening application's code

```
client.connect().then(function(){
    if(client.launchParams.theme) {
        setTheme(client.launchParams.theme);
    }

});
```

