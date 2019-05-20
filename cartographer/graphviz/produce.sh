set -euo pipefail

#cd ../cartographer
#node generate.js > ../graphviz/example.dot
#cd ../graphviz

docker build . -t graphviz
docker run graphviz /bin/cat /tmp/example.svg > ./example.svg
docker run graphviz /bin/cat /tmp/graphviz-2.40.1/cmd/dot/dot_static > ../cartographer/dot_static
chmod +x ../cartographer/dot_static
