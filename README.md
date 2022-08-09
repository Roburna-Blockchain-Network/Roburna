# Roburna Testing

## BUGs
### Issue 1. 
Description: Fails during deployment
Reason: Trying to use dividend tracker before deployment
code: 

``
// exclude bridge Vault from receiving rewards
        bridgeVault = _bridgeVault;
        dividendTracker.excludeFromDividends(bridgeVault);
``

### Issue 2.
Description: "Address zero validation" reverts in `removeFromBlackList` not working.   
Reason: Only blacklisted acounts can be removed.Function `blackListAccount` does not allow blacklist of address zero.
code
``
function removeFromBlackList(address account) external onlyOwner{
        require(_isBlackListed[account] != false, "Already removed");
        require(account != address(0), "Address zero validation");
        require(balanceOf(blackListWallet) >= _blackListedAmount[account], "Insuficcient blackListWallet balance");
        _isBlackListed[account] = false;
        uint256 amount = _blackListedAmount[account];
        super._transfer(blackListWallet, account, amount);
        emit LogAddressRemovedFromBL(account);
    }
``
### Issue 3:
Description:Does not send tokens back to owner after removal from blacklist.
Reason: Account amount of tokens not captured in `blackListAccount`.
code:
``
function blackListAccount(address account) external onlyOwner{
        require(_isBlackListed[account] != true, "Already blacklisted");
        require(account != address(0), "Address zero validation");
        _isBlackListed[account] = true;
        uint256 amount = balanceOf(account);
        _blackListedAmount[account] = amount;
        super._transfer(account, blackListWallet, amount);
        emit LogAddressBlackListed(account);
    }
``


