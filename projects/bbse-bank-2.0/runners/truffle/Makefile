-include .env

all : clean setup compile runTests

# Clean
clean :; rm -rf node_modules

# Setup
setup :; npm i

# Compile
compile :; gtime truffle compile

# Test
runTests :; gtime truffle test
