##Retrieving applications from the System API
The System API holds JSON data on each application is has knowledge of. Each application's data is stored based on its
UUID like so `/application/${application's UUID}`. The JSON data is provided from the backend server to the System API.

***

To get information on an application, a **get** action is used on  `/application/${application's UUID}` resource in the
System API. The full list of resource name can be gathered via a **get** on `/application`.


```
var systemApi = client.system();

var data = { 'title': 'Fake Application'};

systemApi.get('/application/2d48539d-c787-4dd6-be4c-5a0fb0086ff4').then(function(res){
    var applicationData = res.entity;
});
```

The `applicationData` object is of content-type `application/vnd.ozp-application-v1+json` and is formatted as so:

```
{
    "state": "Active",
    "tags": [
        "demo"
    ],
    "description": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed dictum",
    "icons": {
        "small": "https://www.owfgoss.org/ng/dev/mp/api/image/0a6f7d59-e9ef-4bd2-9cac-657b2895923a.png",
        "large": "https://www.owfgoss.org/ng/dev/mp/api/image/cc1535e9-6d27-4b22-a240-cc7cd9281757.png",
        "banner": "https://www.owfgoss.org/ng/dev/mp/api/image/e397056d-cb9f-4972-a741-c2aa89d6d806.png",
        "featuredBanner": "https://www.owfgoss.org/ng/dev/mp/api/image/46665502-dc3d-4b2b-bafe-775255439249.png"
    },
    "launchUrls": {
        "default": "http://ozone-development.github.io/ozp-demo/chart/index.html"
    },
    "intents": [
        {
            "type": "application/json",
            "action": "edit",
            "icon": "",
            "label": null
        },
        {
            "type": "application/json",
            "action": "view",
            "icon": "",
            "label": null
        }
    ],
    "descriptionShort": "An application for charting stock data",
    "approvalStatus": "APPROVED",
    "screenshots": [
        {
            "href": "https://www.owfgoss.org/ng/dev/mp/api/image/ccc38735-dd84-40cc-8184-7f3845bd34c5.png"
        }
    ],
    "uiHints": {
        "singleton": false,
        "width": null,
        "height": null
    },
    "name": "Stock Price Charter",
    "id": "2d48539d-c787-4dd6-be4c-5a0fb0086ff4",
    "type": "Web Application",
    "contentType": "application/vnd.ozp-application-v1+json"
}
```

####Properties of interest

**icons**: URLs corresponding to images to be used as icons for the application.

**launchUrls**: URLs that designate what to open when the application is launched (see
[Launching an Application](launching.md))

**intents**: The intent actions this application is registered to handle. This data is used internally to register
intents on the Intents API (see [Registering an Intent Handler](../../intents/registering.md)).

**id**: The UUID of the application
