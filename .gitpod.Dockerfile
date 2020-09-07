FROM gitpod/workspace-full

# Install custom tools, runtime, etc. using apt-get
# For example, the command below would install "bastet" - a command line tetris clone:
#
# RUN sudo apt-get -q update && \
#     sudo apt-get install -yq bastet && \
#     sudo rm -rf /var/lib/apt/lists/*
#
# More information: https://www.gitpod.io/docs/config-docker/

USER gitpod

# RUN sudo apt-get update && apt-get install pkg-config zip g++ zlib1g-dev unzip python
# RUN wget https://github.com/bazelbuild/bazel/releases/download/0.24.1/bazel-0.24.1-installer-linux-x86_64.sh
# RUN chmod +x bazel-0.24.1-installer-linux-x86_64.sh
# RUN ./bazel-0.24.1-installer-linux-x86_64.sh --user
