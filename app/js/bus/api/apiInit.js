
ozpIwc.apiRoot = ozpIwc.apiRoot || "api";
ozpIwc.apiData=ozpIwc.apiData || {};


ozpIwc.initialized=new ozpIwc.AsyncAction();

(function() {
    var request = new XMLHttpRequest();
    request.onreadystatechange=function() {
        if (request.readyState !== 4) {
            return;
        }
        
        if(request.status  === 200) {
            var data=JSON.parse(this.responseText);
            ozpIwc.initialized.resolve("success",data);
        } else {
            ozpIwc.initialized.resolve("failure",this.statusText,this.responseText);
        }
        
    };
    request.open("GET", ozpIwc.apiRoot, true);
    request.setRequestHeader("Content-Type","application/json");
    request.setRequestHeader("Cache-Control","no-cache");
    request.send();
})();

