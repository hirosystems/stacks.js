#!/bin/sh

BLOCKSTACK_BRANCH="rc-0.14.2"

test -d /home/ubuntu/blockstack.js || exit 1

sudo mkdir -p /usr/share/node_modules
test -d /usr/share/node_modules/blockstack && rm -rf /usr/share/node_modules/blockstack
sudo cp -a /home/ubuntu/blockstack.js /usr/share/node_modules/blockstack

# get bitcoind
sudo add-apt-repository -y ppa:bitcoin/bitcoin || exit 1
sudo apt-key adv --keyserver hkp://p80.pool.sks-keyservers.net:80 --recv-keys F76221572C52609D
sudo apt-get -y update || exit 1
sudo apt-get -y install bitcoind || exit 1

# needed on CircleCI's VMs
pip install --upgrade pip
pip install --upgrade six
pip install --upgrade setuptools
pip install --upgrade cryptography
pip install --upgrade scrypt
pip install --upgrade fastecdsa

# fetch and install virtualchain 
git clone https://github.com/blockstack/virtualchain /tmp/virtualchain
cd /tmp/virtualchain && git checkout "$BLOCKSTACK_BRANCH"
cd /tmp/virtualchain && ./setup.py build && ./setup.py install

# fetch blockstack core and integration tests
git clone https://github.com/blockstack/blockstack-core /tmp/blockstack-core
cd /tmp/blockstack-core && git checkout "$BLOCKSTACK_BRANCH"

# install blockstack core and integration tests
cd /tmp/blockstack-core && ./setup.py build && ./setup.py install 
cd /tmp/blockstack-core/integration_tests && ./setup.py build && ./setup.py install

# set up node
npm install -g babel
npm install -g browserify

# run the relevant integration tests
blockstack-test-scenario blockstack_integration_tests.scenarios.name_preorder_register_portal_auth || exit 1
blockstack-test-scenario blockstack_integration_tests.scenarios.name_preorder_register_portal_datastore || exit 1
