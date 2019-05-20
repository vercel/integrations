FROM amazonlinux:2017.03.1.20170812

ENV PATH=/tmp/.yarn/bin:/tmp/.config/yarn/global/node_modules/.bin:/var/lang/bin:/usr/local/bin:/usr/bin/:/bin \
  LD_LIBRARY_PATH=/lib64:/usr/lib64 \
  HOME=/tmp

RUN echo -e "[main]\nassumeyes=1" > /etc/yum.conf && \
  echo "%_netsharedpath /sys:/proc" >> /etc/rpm/macros.netshared && \
  touch /var/lib/rpm/* && \
  yum update && \
  rpm --rebuilddb && yum install autoconf bsdtar bzip2 gcc gcc-c++ git glibc-devel gzip lz4 make strace tar unzip which && \
  yum clean all && \
  rm -rf /var/cache/yum /var/lib/rpm/__db.* /tmp && \
  mkdir /tmp

RUN yum-config-manager --enable epel && \
  yum install -y https://centos6.iuscommunity.org/ius-release.rpm && \
  yum install -y python36u python36u-libs python36u-devel python36u-pip && \
  ln -s /usr/bin/python3.6 /usr/bin/python3 && \
  ln -s /usr/bin/pip3.6 /usr/bin/pip

RUN pip install --upgrade pip

RUN rm -rf /var/runtime /var/lang

WORKDIR /tmp
RUN curl https://graphviz.gitlab.io/pub/graphviz/stable/SOURCES/graphviz.tar.gz | tar xvz
WORKDIR /tmp/graphviz-2.40.1
RUN ./configure --enable-static --prefix=/tmp
RUN make

WORKDIR /tmp
COPY ./example.dot ./example.dot
RUN graphviz-2.40.1/cmd/dot/dot_static -Tsvg example.dot -o example.svg
RUN head example.svg
