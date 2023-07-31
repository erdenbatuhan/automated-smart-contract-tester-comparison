# 0) Clean & Prepare
forge clean
mv src src_org

# 1) Force the pre-installation of the compiler and the pre-creation of the tests and dependencies
cp -R src_initial src
forge build
rm -rf src

# 2) Copy the contracts (the src folder) to the working directory
mv src_org src

# 3) Run the tests and measure the time
/usr/bin/time forge test -vv
