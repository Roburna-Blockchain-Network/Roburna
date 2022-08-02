const { ethers } = require("hardhat");
const hre = require("hardhat");

async function main() {
  this.Token = await ethers.getContractFactory("Roburna")
  this.Dividend = await ethers.getContractFactory("RoburnaDividendTracker")

  
  const marketingWallet = "0x37EF590E0BDe413B6407Bc5c4e40C3706dEEBc86"
  const usdt = "0x7ef95a0fee0dd31b22626fa2e10ee6a223f8a684"
  const router = "0x9Ac64Cc6e4415144C455BD8E4837Fea55603e5c3"
  
  this.token = await this.Token.deploy(router, usdt, marketingWallet)

  await this.token.deployed()
    
  
  this.dividendTracker = await this.Dividend.deploy(usdt , this.token.address)
  await this.dividendTracker.deployed()


  console.log("Token deployed to:", this.token.address);
  console.log("dividendTracker deployed to:", this.dividendTracker.address);
}


main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
