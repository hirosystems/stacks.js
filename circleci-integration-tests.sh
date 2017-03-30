#!/bin/sh

BLOCKSTACK_BRANCH="rc-0.14.2"

# get bitcoind
sudo add-apt-repository -y ppa:bitcoin/bitcoin || exit 1
sudo apt-key adv --keyserver hkp://p80.pool.sks-keyservers.net:80 --recv-keys F76221572C52609D
sudo apt-get -y update || exit 1
sudo apt-get -y install bitcoin || exit 1

# needed on CircleCI's VMs
pip install --upgrade pip
pip install --upgrade six
pip install --upgrade setuptools
pip install --upgrade cryptography
pip install --upgrade scrypt
pip install --upgrade fastecdsa

# install Blockstack and integration tests
git clone https://github.com/blockstack/blockstack-core /tmp/blockstack-core
cd /tmp/blockstack-core && git checkout "$BLOCKSTACK_BRANCH"

cd /tmp/blockstack-core && ./setup.py build && ./setup.py install 
cd /tmp/blockstack-core/integration_tests && ./setup.py build && ./setup.py install

npm install -g babel
npm install -g browserify

# run the relevant integration tests
blockstack-test-scenario blockstack_integration_tests.scenarios.name_preorder_register_portal_auth || exit 1
blockstack-test-scenario blockstack_integration_tests.scenarios.name_preorder_register_portal_datastore || exit 1
