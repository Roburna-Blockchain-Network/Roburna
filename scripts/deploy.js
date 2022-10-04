const { ethers } = require("hardhat");
const hre = require("hardhat");

async function main() {
  this.Token = await ethers.getContractFactory("Roburna")
  this.Dividend = await ethers.getContractFactory("RoburnaDividendTracker")

  
  const marketingWallet = "0x26C3F83cB057ba3303A5dD508021952ad372E963"
  const blackListWallet = "0xC6d96E8792db0e8aF14C112cA3239d9FAD70aa98"
  const bridgeVault = "0x4648E40DC12D9cdB54BeFA45b34FC0E62C5bA41C"
  const buyBackWallet = '0xaF9fa2aCbE7470A36528fA24CA3699aD178a6ab3'
  const usdc = "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d"
  const router = "0x10ED43C718714eb63d5aA57B78B54704E256024E"
  
  this.token = await this.Token.deploy(router, usdc, marketingWallet, buyBackWallet, blackListWallet, bridgeVault)

  await this.token.deployed()
    
  
  this.dividendTracker = await this.Dividend.deploy(usdc , this.token.address)
  await this.dividendTracker.deployed()


  console.log("Token deployed to:", this.token.address);
  console.log("dividendTracker deployed to:", this.dividendTracker.address);
}


main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
