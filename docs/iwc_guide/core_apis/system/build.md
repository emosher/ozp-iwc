##Build Information in the System API
The System API dedicates the `/system` resource for any information desired from the current backend server's build.

***

###Retrieving Build Information
To retrieve information on the current backend, the `get` action is used on the `/system` resource of the System API.

```
var systemApi = client.system();

systemApi.get('/system').then(function(res){
    console.log(res);
});
```

The `entity` of the response `res` is of the `application/vnd.ozp-system-v1+json` format:

```
{
    "version": "1.0",
    "name": "IWC Demo Site",
    "contentType": "application/json"
}
```

**version**: The current version of the backend.

**name**: The name of the backend for identification purposes.
