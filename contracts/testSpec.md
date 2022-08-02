Expected tests
1. deploy
2. initialize dividend tracker 
3. make sure it doesn't take fee for normal transfer
4. make sure it takes fee on buy/sell
5. make sure blacklist works fine (it should transfer user balance to blackListWallet)
6. make sure after blacklisting an account , the account cannot send or receive tokens
7. make sure it collects and distributes fees correctly
8. make sure removeFromBlacklist works fine
9. make sure all the functions related to bridge work fine (lock/unlock/onlyBridge)
