## System API Applications
The IWC's knowledge of applications available is critical for handling data. By knowing what applications are available,
the IWC knows what it can launch to handle intents that are fired from the Intent API (see
[Intent Invoking](../../intents/invoking.md) and [Intent Choosing](../../intents/choosing.md))

The IWC designates the `/application` resource in the System API to hold a reference to each application it has
knowledge of.

***

###Retrieving Available Applications
To retrieve a set of the available applications, use a `get` action on the `/application` resource of the System API.

```
var systemApi = client.system();

systemApi.get('/application').then(function(res){
    var applicationResources = res.entity;
});
```

The entity of the response `res` holds an *array* of all the application resource names available on the bus. Each
application is named using the following schema `/application/${application's UUID}`.

An example of the value assigned to `applicationResources` above looks as follows:

```
[
       "/application/2d48539d-c787-4dd6-be4c-5a0fb0086ff4",
       "/application/f0d132c0-31ab-40c8-8421-791a6529c8d5"
]
```