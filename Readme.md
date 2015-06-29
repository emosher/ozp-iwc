[ozp-iwc](http://ozone-development.github.io/ozp-iwc/) [![Build Status](https://travis-ci.org/ozone-development/ozp-iwc.svg?branch=master)](https://travis-ci.org/ozone-development/ozp-iwc)
==============================
The Ozone Platform's Inter-Widget Communications (IWC) enables loosely coupled integration of web applications by
applying the best practices of enterprise service buses and service-oriented architecture to a completely
in-browser system that works across multiple tabs and windows. Applications can share data and services then use
the data and services offered by others to enrich their own user experience.

The IWC provides lightweight integration.
--------------
Today’s rich web applications tend to carry more state than a simple link can convey, and componentized development
allows UI elements to be embedded, but at the cost of maintenance and application size. The IWC allows application
frontends to expose data and services to other applications within the browser. Just like services on an ESB, these
elements can be developed, deployed, and extended without impact to other applications.

The IWC stays out of your way.
--------------
The IWC is designed to minimize the impact on your application. It is completely agnostic to the application
presentation, including a tiny client library that adds a single, invisible element to your page.


Links
--------------
  * [Quick Start](docs/iwc_guide/quickStart.md)
  * [FAQ](docs/iwc_guide/FAQ.md)
  * [Developer's Guide](docs/iwc_guide/SUMMARY.md)


Demo
---------------
Various example widgets using the ozp-iwc can be found at:
http://ozone-development.github.io/ozp-demo/
