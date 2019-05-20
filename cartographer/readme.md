# Cartographer

Displays a graph of ZEIT objects (domains, aliases, deployments, deployment names, env var names) and their relations.

How it works:

* Graphviz is compiled statically inside docker using Amazon Linux. So it can be used as a single binary inside lambda.
* Domains, aliases and deployments are requested using public ZEIT API.
* DOT-file, representing a graph of objects and their relations, is created from that data.
* Aliases are grouped by domains. Deployments are grouped by deployment names.
* DOT-file is passed to `dot_static` and SVG-file is rendered.
* SVG-file is displayed on webpage using data url (base64) of `img` tag.

Worth mentioning:

* Deployed as v2 lambda
* Uses only public ZEIT API, can be open source

TODO

* Clickable to show relations of selected object
