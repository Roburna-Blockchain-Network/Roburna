
  const { expect } = require("chai");
  const { ethers } = require("hardhat");
  const { utils, BigNumber } = require("ethers");
  const {setTimeout } =require("timers/promises")


  describe("Roburna Testing", function () {

     before(async function () {

      //get signers
        [owner, marketingWallet, buyBackWallet, blackListWallet, bridgeVault, bridge, user1,user2,user3,user4,user5,user6] = await ethers.getSigners();
      
      //get contract factory
      this.BEP20 = await ethers.getContractFactory("Dividend")
      this.Roburna  =  await ethers.getContractFactory("Roburna");
      this.RoburnaDividendTracker = await hre.ethers.getContractFactory("RoburnaDividendTracker");
      
     
        //Deploy BEP20 
      this.USDC = await this.BEP20.deploy('USD COIN','USDC')
      await this.USDC.deployed()
       
      //deploy this.RBA
      this.RBA = await this.Roburna.deploy(process.env.ROUTER02,this.USDC.address ,marketingWallet.address, buyBackWallet.address, blackListWallet.address, bridgeVault.address);
      await this.RBA.deployed()
     
      //deploy this.RBAT
      this.RBAT = await this.RoburnaDividendTracker.deploy(this.USDC.address,this.RBA.address)
      await this.RBAT.deployed()

      // console.log(this.USDC.address, 'USDC')
      // console.log(this.RBA.address, 'RBA')
      // console.log(this.RBAT.address, 'RBAT')
      
      
      //set provider 
      this.provider = ethers.provider;

      //set defaultPair
      this.pairAddress = this.RBA.defaultPair()
      this.pair = new ethers.Contract(
          this.pairAddress,
          ['function totalSupply() external view returns (uint)','function balanceOf(address owner) external view returns (uint)','function approve(address spender, uint value) external returns (bool)','function decimals() external pure returns (uint8)','function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)'],
          this.provider
      )
      this.pairsigner =this.pair.connect(owner)
      

      //set Router
      this.router02 = new ethers.Contract(
      process.env.ROUTER02,
      ['function swapExactETHForTokensSupportingFeeOnTransferTokens( uint amountOutMin,address[] calldata path,address to,uint deadline) external payable','function WETH() external pure returns (address)','function addLiquidityETH(address token, uint amountTokenDesired, uint amountTokenMin, uint amountETHMin, address to, uint deadline) external payable returns (uint amountToken, uint amountETH, uint liquidity)', 'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)', 'function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)', 'function swapExactTokensForETHSupportingFeeOnTransferTokens( uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external','function removeLiquidityETHSupportingFeeOnTransferTokens( address token,uint liquidity,uint amountTokenMin,uint amountETHMin,address to,uint deadline) external returns (uint amountETH)'], 
      this.provider);
      this.routersigner = this.router02.connect(owner)


      //Enable transfer
      await this.RBA.setTransfersEnabled(true)

      //Initialize devidend tracker             
      await  this.RBA.initializeDividendTracker(this.RBAT.address)
      const ownerCheck =  await this.RBA.getOwner()
      expect(ownerCheck).to.be.equal(owner.address)

      //Top ETH 
      await network.provider.send("hardhat_setBalance", [ owner.address, '0x1431E0FAE6D7217CAA0000000'])
      await network.provider.send("hardhat_setBalance", [ bridge.address, '0x1431E0FAE6D7217CAA0000000'])
     
      this.liquidityERC20 = ethers.utils.parseEther('100000000')
      this.liquidityETH  = ethers.utils.parseEther('100000')

      //add liquidty WETH-this.RBAT
      await this.RBA.approve(process.env.ROUTER02, this.liquidityERC20);
      await this.routersigner.addLiquidityETH(
        this.RBA.address,
        this.liquidityERC20,
        0,
        0,
        owner.address,
        Math.floor(Date.now() / 1000) + 60 * 10,
        {value : this.liquidityETH}
        )
        
        //add liquidity WETH-USDC
        await this.USDC.approve(process.env.ROUTER02, this.liquidityERC20);
        await this.routersigner.addLiquidityETH(
          this.USDC.address,
          this.liquidityERC20,
          0,
          0,
          owner.address,
          Math.floor(Date.now() / 1000) + 60 * 10,
         {value : this.liquidityETH }
        )
 
        sellFee = await this.RBA.sellTotalFees()/10000
        buyFees = await this.RBA.buyTotalFees()/10000
        swapAmountAt = await this.RBA.swapTokensAtAmount()

        addressZero = '0x0000000000000000000000000000000000000000'

     });

    describe("Deployment", function () {


        it("Should set the right supply amount",async function (){
            //expect(await this.RBA.totalSupply()).to.equal(BigInt(10**9*10**18))
            console.log(`\t\tSupply: ${await this.RBA.totalSupply()/10**18}`)
            expect(await this.USDC.totalSupply()).to.equal(BigInt(10**9*10**18))
        })

        it('Set other state valiables to right values',async function(){

         expect(await this.RBA.transfersEnabled()).to.be.equal(true) 
         expect(await this.RBA.gasForProcessing()).to.be.equal(300000)
         expect(await this.RBA.defaultDexRouter()).to.be.equal(process.env.ROUTER02)
         expect(await this.RBA.defaultPair()).to.be.equal( await this.pairAddress)

        })

      }); 

    describe("Transfer:Among token holders", function () {

        it("Should transfer with no fee", async function () {
          // Transfer 50 tokens from owner to user1
          const ownerBal = await this.RBA.balanceOf(owner.address)
          const amount = ethers.utils.parseEther('50')
          await this.RBA.transfer(user1.address,amount);
          expect(await this.RBA.balanceOf(owner.address)/10**18).to.be.equal(Math.round((ownerBal - amount)/10**18));
          expect(await this.RBA.balanceOf(user1.address)).to.be.eq(amount)
  
          // Transfer 50 tokens from user1 to user2
          const user1Balance = await this.RBA.balanceOf(user1.address);
          await this.RBA.connect(user1).transfer(user2.address, amount);
          expect(await this.RBA.balanceOf(user1.address)/10**18).to.be.equal(Math.round((user1Balance - amount)/10**18));
          expect(await this.RBA.balanceOf(user2.address)).to.be.eq(amount)
  
          //Treansfer back to owner 
          const user2Balance = await this.RBA.balanceOf(user2.address); 
          await this.RBA.connect(user2).transfer(user3.address, amount);
          expect(await this.RBA.balanceOf(user2.address)/10**18).to.be.equal(Math.round((user2Balance - amount)/10**18));
          expect(await this.RBA.balanceOf(user3.address)).to.be.eq(amount)
  
        });
  
        it('Should allow owner to send and receive more than maxwallentToken amount', async function(){
           //check the maxmum wallent token amount 
          const maxAmount = await this.RBA.maxWalletToken()
          const newAmount = (maxAmount/10**18+10**7)*10**18
          console.log(`\t\tMax Wallent Amount ${await this.RBA.maxWalletToken()}`)
          
          //Transfer from owner to user1 more than max amount
          await this.RBA.transfer(user1.address, BigInt(newAmount))
          expect(await this.RBA.balanceOf(user1.address)/10**18).to.be.greaterThan(maxAmount/10**18)

          //Tranfer back to owner 
          const ownerBal = await this.RBA.balanceOf(owner.address)
          await this.RBA.connect(user1).transfer(owner.address, BigInt(newAmount))
          expect(await this.RBA.balanceOf(owner.address)/10**18).to.be.greaterThan(ownerBal/10**18)

        });

        it('Should not allow other holders to send more than MaxWallentToken amount', async function(){
          //Transfer from owner to user1 more than 500K (expect user1bal == 500k)
          const maxAmount = await this.RBA.maxWalletToken()
          const newAmount = (maxAmount/10**18+10**7)*10**18
          await this.RBA.transfer(user1.address, BigInt(newAmount))
          const user1Bal = await this.RBA.balanceOf(user1.address)
          expect(user1Bal).to.be.equals(BigInt(newAmount))



          //Transfer from user1 to user2 more than Max wallent amount (expect revert, "RBA: Exceeds maximum wallet token amount." )
         await expect(this.RBA.connect(user1).transfer(user2.address, BigInt(newAmount))).to.be.revertedWith(
          'Roburna: Exceeds maximum wallet token amount')})
      }); 

    describe('Swap:RBAT-ETH pool',function () {
        it("should take sell fee", async function(){
          //Transfer 100 from owner to user1
          await this.RBA.transfer(user1.address, utils.parseEther('100'))
          expect(await this.RBA.balanceOf(user1.address)).to.be.equal(utils.parseEther('100'))

          //get ETH bal before swap
          const  balanceETH = await this.provider.getBalance(user1.address)/10**18

          const amount = ethers.utils.parseEther('50')

          //swap 50 token in to recieve ETH
          this.routersigner = await this.router02.connect(user1)
          await this.RBA.connect(user1).approve(process.env.ROUTER02,amount)

          const WETH = await this.routersigner.WETH()
          const path = [this.RBA.address,WETH]

          
          await this.routersigner.swapExactTokensForETHSupportingFeeOnTransferTokens(
            amount,
            0,
            path,
            user1.address,
            Math.floor(Date.now() / 1000) + 60 * 10,
          )


          //calculated expected ETH
          const ERC20 = this.liquidityERC20/10**18
          const ETH = this.liquidityETH/10**18

          const pairConstant = ERC20 * ETH
          const swapAmount = (amount/10**18) * (1 - sellFee)
          const expectedETH = (ETH - pairConstant/(ERC20 + swapAmount))
         

          const _balanceETH = await this.provider.getBalance(user1.address)/10**18

          console.log('              Sent RBAT Amount:',50)
          console.log('              Expected ETH amount:',expectedETH)
          console.log('              Recieved ETH amount:', 
          _balanceETH - balanceETH > 0 ? _balanceETH - balanceETH : 0
           )

        

        })

        it("Should take buy fee", async function(){
        
          //connect address 4
          this.routersigner = await this.routersigner.connect(user1);
          const WETH = await this.routersigner.WETH()
          const path = [WETH, this.RBA.address]

         const  amount = ethers.utils.parseEther('10')

         await this.routersigner.swapExactETHForTokensSupportingFeeOnTransferTokens(
            0,
            path,
            user1.address,
            Math.floor(Date.now() / 1000) + 60 * 10,
           {value:amount}
          )

          //calculated expected Token
          const liquidityERC20 = this.liquidityERC20/10**18
          const liquidityETH = this.liquidityETH/10**18

          const pairConstant = liquidityERC20 * liquidityETH 

          const tokens = liquidityERC20 - pairConstant/(liquidityETH + amount/10**18)
          
          //deduct fees
          const expected = tokens * (1- buyFees)
          const actual  = await this.RBA.balanceOf(user1.address)/10**18

         // expect(Math.round(await this.RBA.balanceOf(user3.address)/10**18)).to.be.equal(Math.round(expected-2))


          console.log('              Sent ETH Amount:',10)
          console.log('              Expected RBAT amount:',expected)
          console.log('              Recieved RBAT amount:',actual)


        })


     });

    describe.only('Swap, Liquidify, send fee', function() {


      it('should send fee ', async function () {
        /** liquidify & send fee is enabled when we collect fees of 5000. We swap till this fees is collected, fee = 12% */

        const {0:RBAT,1:ETH } =  await this.pairsigner.getReserves()

      reserveA = await this.liquidityERC20/10**18
      reserveB = await this.liquidityETH/10**18
      
      async function amm(amountA) {

        rA = reserveA
        rB = reserveB

        const pairConstant = await rA * rB
        
        reserveA = await rA + amountA
        reserveB = pairConstant/reserveA

        const expectedB = await rB - reserveB

        return expectedB 

      }

      async function ammF(rA,rB, amountA) {

        const pairConstant = await rA * rB
        
        A = await rA + amountA
        B = pairConstant/A

        const expectedB = await rB - B

        return expectedB 

      }
     
        console.log('           ')
        console.log('           RBAT Reserve:',RBAT/10**18)
        console.log('           ETH Reserve:',ETH/10**18)
        console.log('           ')

      //send holding amount to 1,2,3,4,5
      await this.RBA.transfer(user1.address, ethers.utils.parseEther('10000'))
      await this.RBA.transfer(user2.address, ethers.utils.parseEther('20000'))
      await this.RBA.transfer(user3.address, ethers.utils.parseEther('30000'))
      await this.RBA.transfer(user4.address, ethers.utils.parseEther('40000'))
      await this.RBA.transfer(user5.address, ethers.utils.parseEther('60000'))


       const user1Amount = utils.parseEther('50000')


        //Transfer 
        await this.RBA.transfer(user1.address, user1Amount)
        //expect(await this.RBA.balanceOf(user1.address)).to.be.equal(user1Amount)
      
        //connect user 1 and approve token spending
        await this.RBA.connect(user1).approve(process.env.ROUTER02, user1Amount )

         //path
         const wETH = await this.routersigner.WETH()
         const path = [this.RBA.address,wETH]
 
        //swap
        this.routersigner = await this.routersigner.connect(user1)
        await this.routersigner.swapExactTokensForETHSupportingFeeOnTransferTokens(
          user1Amount,
          0,
          path,
          user1.address,
          Math.floor(Date.now() / 1000) + 60 * 10,
        )


      //confirm fee is collected = 1400/10000 = 0.14 = 14%
      const feeFromUser1 = await this.RBA.balanceOf(this.RBA.address)/10**18
      expect(feeFromUser1).to.be.equal(Math.round(sellFee*user1Amount/10**18))

      console.log(`\x1b[32m%s\x1b[0m`,`user1 Swaps: ${Math.round(user1Amount/10**18)} RBA Tokens `)
      console.log(`\t\tgives a fee 0f: ${feeFromUser1}`)
      console.log(`\t\tswaps to : ${await amm(user1Amount/10**18)} ETH\n`)
      
      //connect user2 and approve token spending
      const user2Amount = utils.parseEther('50000')

      await this.RBA.transfer(user2.address, user2Amount)
      //expect(await this.RBA.balanceOf(user2.address)).to.be.equal(user2Amount)
      await this.RBA.connect(user2).approve(process.env.ROUTER02, user2Amount)

      //swap
      this.routersigner = await this.routersigner.connect(user2)
      await this.routersigner.swapExactTokensForETHSupportingFeeOnTransferTokens(
        user2Amount,
        0,
        path,
        user2.address,
        Math.floor(Date.now() / 1000) + 60 * 10,
      )

    
      const feeFromUser2 = (await this.RBA.balanceOf(this.RBA.address)/10**18) - feeFromUser1
      expect(feeFromUser2).to.be.equal(Math.round(sellFee*user2Amount/10**18))

      console.log(`\x1b[32m%s\x1b[0m`,`user2 Swaps: ${Math.round(user2Amount/10**18)} RBA Tokens `)
      console.log(`\t\tgives a fee 0f: ${feeFromUser2}`)
      console.log(`\t\tswaps to: ${await amm(user2Amount/10**18)} ETH\n`)

      //get wallent balances before swap and liquidify
      const marketingWalletBal = await this.provider.getBalance(marketingWallet.address)/10**18
      const buyBackWalletBal =  await this.RBA.balanceOf(buyBackWallet.address)/10**18
      const blackListWalletBal = await this.provider.getBalance(blackListWallet.address)/10**18
      const bridgeVaultBal =  await this.provider.getBalance(bridgeVault.address)/10**18
      

       //connect user  3 and approve token spending
      const user3Amount = utils.parseEther('50000')
      await this.RBA.transfer(user3.address, user3Amount)
      await this.RBA.connect(user3).approve(process.env.ROUTER02, user3Amount)
     
      //swap
      
      this.routersigner = this.routersigner.connect(user3)
      await this.routersigner.swapExactTokensForETHSupportingFeeOnTransferTokens(
        user3Amount,
        0,
        path,
        user3.address,
        Math.floor(Date.now() / 1000) + 60 * 10,
      )

      const feeFromUser3 = (await this.RBA.balanceOf(this.RBA.address)/10**18) - feeFromUser2 -feeFromUser1
      //expect(Math.round(feeFromUser3)).to.be.equal(Math.round(sellFee*user3Amount/10**18))

      console.log(`\x1b[32m%s\x1b[0m`,`user3 Swaps: ${Math.round(user3Amount/10**18)} RBA Tokens `)
      console.log(`\t\tgives a fee 0f: ${feeFromUser3}`)
      console.log(`\t\tswaps to: ${await amm(user3Amount/10**18)} ETH\n`)


      
      //get wallet bal after swap
    const _marketingWalletBal = await this.provider.getBalance(marketingWallet.address)/10**18
    const _buyBackWalletBal =  await this.RBA.balanceOf(buyBackWallet.address)/10**18
    const _blackListWalletBal = await this.provider.getBalance(blackListWallet.address)/10**18
    const _bridgeVaultBal =  await this.provider.getBalance(bridgeVault.address)/10**18
      

        
      // Eth collected
      const sellMarketingFee = await this.RBA.sellMarketingFee()/10000
      const mFee =  (swapAmountAt/10**18*sellMarketingFee)/sellFee
      console.log('\x1b[33m%s\x1b[0m',`Marketing Amount collected: ${mFee}`)
      console.log('           marketing ETH Estimate:',await amm(mFee))
      console.log('           marketing ETH Actual:',_marketingWalletBal - marketingWalletBal)
      console.log('           ')

      const sellBuyBackFee = await this.RBA.sellBuyBackFee()/10000
      const bFee =  (swapAmountAt/10**18*sellBuyBackFee)/sellFee

      console.log('\x1b[33m%s\x1b[0m',`Buy Back Amount`)
      console.log(`\t\tBuy Back RBA Estimate: ${bFee}`)
      console.log('\t\tBuy Back RBA Actual:',_buyBackWalletBal - buyBackWalletBal)
      console.log('           ')

      const dividend = await this.USDC.balanceOf(this.RBAT.address)
      console.log(`Total dividend collected:${dividend/10**18}`)
      //await this.RBAT.distributeDividends(dividend)

    })

     }); 

    describe('blackListWallet', function(){

      it('BlackListAccount', async function(){
        
      await this.RBA.transfer(user4.address, ethers.utils.parseEther('10000'))
      expect(await this.RBA.balanceOf(user4.address)).to.be.equal(ethers.utils.parseEther('10000'))

      //Blacklist user user4
      await expect(this.RBA.blackListAccount(user4.address)).to.emit(
        this.RBA, 'LogAddressBlackListed').withArgs(user4.address)
     
        expect(await this.RBA.balanceOf(user4.address)).to.be.equal(0)
        expect(await this.RBA.balanceOf(blackListWallet.address)).to.be.equal(
          ethers.utils.parseEther('10000'))
      
      //revert 1: "Already blacklisted"
      await expect(this.RBA.blackListAccount(user4.address)).to.be.revertedWith(
        "Already blacklisted")

       //revert 2: "Address zero validation"
       await expect(this.RBA.blackListAccount(addressZero)).to.be.revertedWith(
        "Address zero validation" )


      //revert 3
      await expect(this.RBA.transfer(user4.address, ethers.utils.parseEther('10000'))).to.be.revertedWith(
        "Address blacklisted"
      )
     
      })

      it('removeFromBlackList', async function(){

          //Revert 1: "Insuficcient blackListWallet balance"
          await this.RBA.connect(blackListWallet).transfer(owner.address, ethers.utils.parseEther('100'))
          await expect(this.RBA.removeFromBlackList(user4.address)).to.be.revertedWith(
            "Insuficcient blackListWallet balance")
          await  this.RBA.transfer(blackListWallet.address, ethers.utils.parseEther('100') )

         //console.log(`\t\tIs blacklisted? ${await this.RBA._isBlackListed(user4.address)} `)

         await expect(this.RBA.removeFromBlackList(user4.address)).to.emit(
          this.RBA, 'LogAddressRemovedFromBL').withArgs(user4.address)
       
         //console.log(`\t\tIs blacklisted? ${await this.RBA._isBlackListed(user4.address)} `)

         expect(await this.RBA.balanceOf(blackListWallet.address)).to.be.equal(0)
          
         expect(await this.RBA.balanceOf(user4.address)).to.be.equal(ethers.utils.parseEther('10000'))

          //Revert 1: "Already removed"
          await expect(this.RBA.removeFromBlackList(user4.address)).to.be.revertedWith("Already removed")

          
      })



      
    })

    describe("Bridge", function(){
      it('setBridge', async function(){
        await expect(this.RBA.setBridge(bridge.address)).to.emit(
          this.RBA, "LogSetBridge").withArgs(owner.address, bridge.address)

        //Reverts
        await expect(this.RBA.setBridge(bridge.address)).to.be.revertedWith("Same Bridge!")
        await expect(this.RBA.setBridge(addressZero)).to.be.revertedWith("Zero Address")

    
      })

      it('lock', async function(){
        //Revert 1:"Zero address"
        await expect(this.RBA.connect(bridge).lock(
          addressZero, ethers.utils.parseEther('1000'))).revertedWith("Zero address")

        //Revert 2: "Lock amount must be greater than zero"
        await expect(this.RBA.connect(bridge).lock(
            user5.address, ethers.utils.parseEther('000'))).revertedWith(
              "Lock amount must be greater than zero")

        //Revert 3:  "Insufficient funds"
        await expect(this.RBA.connect(bridge).lock(
          user5.address, ethers.utils.parseEther('1000'))).revertedWith(
            "Insufficient funds")

       await this.RBA.transfer(user5.address, ethers.utils.parseEther('1000'))

       await expect(this.RBA.connect(bridge).lock(
        user5.address, ethers.utils.parseEther('1000'))).revertedWith(
          "ERC20: transfer amount exceeds allowance")

      await this.RBA.connect(user5).approve(
        bridge.address, ethers.utils.parseEther('1000'))

      await expect(this.RBA.connect(bridge).lock(
          user5.address, ethers.utils.parseEther('1000'))).to.emit(
            this.RBA, 'LogLockByBridge').withArgs(user5.address,ethers.utils.parseEther('1000') )

      expect(await this.RBA.balanceOf(bridgeVault.address)).to.be.equal(
        ethers.utils.parseEther('1000'))
      


      })

      it('unlock', async function(){
        //Revert 1:"Zero address"
        await expect(this.RBA.connect(bridge).unlock(
          addressZero, ethers.utils.parseEther('1000'))).revertedWith("Zero address")

        //Revert 2: "Lock amount must be greater than zero"
        await expect(this.RBA.connect(bridge).unlock(
            user5.address, ethers.utils.parseEther('000'))).revertedWith(
              "Unlock amount must be greater than zero")

        //Revert 3:  "Insufficient funds"
        await expect(this.RBA.connect(bridge).unlock(
          user5.address, ethers.utils.parseEther('10000'))).revertedWith(
            "Insufficient funds")

        //Check bridge bal before withdraw
      expect(await this.RBA.balanceOf(bridgeVault.address)).to.be.equal(
        ethers.utils.parseEther('1000'))
      
      //await this.RBA.connect(bridgeVault).approve(bridge.address, ethers.utils.parseEther('500') )
        //success !
        await expect(this.RBA.connect(bridge).unlock(
          user5.address, ethers.utils.parseEther('500'))).to.emit(
            this.RBA, 'LogUnlockByBridge').withArgs(user5.address,ethers.utils.parseEther('500') )

        expect(await this.RBA.balanceOf(bridgeVault.address)).to.be.equal(
          ethers.utils.parseEther('500'))
          expect(await this.RBA.balanceOf(bridgeVault.address)).to.be.equal(
            ethers.utils.parseEther('500'))
        expect(await this.RBA.balanceOf(user5.address)).to.be.equal(
            ethers.utils.parseEther('500'))

      })
      

    })

    describe('Update',function(){
        
        it('Should update name and symbol', async function(){ 
            await this.RBA.updateNameAndSymbol('ButtleOfArmageddon', 'BOA')
            expect(await this.RBA.name()).to.be.equal('ButtleOfArmageddon')
            expect(await this.RBA.symbol()).to.be.equal('BOA')

            //revert: require(!nameChanged, "BattlefieldOfRenegades: Name already changed");
            await expect(this.RBA.updateNameAndSymbol('ButtleOfArmageddon', 'BOA')).to.be.revertedWith('BattlefieldOfRenegades: Name already changed')

        })
        //Vault1, Vault2, liquidity
        it('Should update Wallet address',async function(){
          //reverts
          await  expect( this.RBA.updateVault1(user1.address)).to.revertedWith('BattlefieldOfRenegades: The gameVault wallet is already this address')
          await  expect( this.RBA.updateVault2(user2.address)).to.revertedWith('BattlefieldOfRenegades: The safetyVault wallet is already this address')
          await  expect( this.RBA.updateLiquidityWallet(owner.address)).to.revertedWith('BattlefieldOfRenegades: The liquidity wallet is already this address')
          
          expect(await this.RBA.updateVault1(user1.address)).to.emit('vault1Updated').withArgs(user1.address,user1.address)
          expect(await this.RBA.updateVault2(user2.address)).to.emit('vault1Updated').withArgs(user2.address, user2.address)
          expect(await this.RBA.updateLiquidityWallet(user3.address)).to.emit('LiquidityWalletUpdated').withArgs(user3.address, addr3.address)
          
          
          })

          //dateSellFees( uint256 _dividendFee,uint256 _liquidityFee, _gameVaultFee,uint256 _safetyVaultFee
        it('Should update buy and sell fees',async function() {

          await  this.RBA.updateBuyFees(1000, 400,400, 200);
          await  this.RBA.updateSellFees(2000, 300, 500, 200)

            expect(await  this.RBA.buyFeesCollected()).to.be.equal(0)
            expect(await  this.RBA.buyDividendFee()).to.be.equal(1000)
            expect(await  this.RBA.buyLiquidityFee()).to.be.equal(400)
            expect(await  this.RBA.buyGameVaultFee()).to.be.equal(400)
            expect(await  this.RBA.buySafetyVaultFee()).to.be.equal(200)
            expect(await  this.RBA.buyTotalFees()).to.be.equal(2000)  
            
            expect(await  this.RBA.sellFeesCollected()).to.be.equal(0)
            expect(await  this.RBA.sellDividendFee()).to.be.equal(2000)
            expect(await  this.RBA.sellLiquidityFee()).to.be.equal(300)
            expect(await  this.RBA.sellGameVaultFee()).to.be.equal(500)
            expect(await  this.RBA.sellSafetyVaultFee()).to.be.equal(200)
            expect(await  this.RBA.sellTotalFees()).to.be.equal(3000)

            //reverts
            await expect(this.RBA.updateBuyFees(1000, 2000,1000, 2000)).to.be.revertedWith('Max fee is 50%')
            await  expect(this.RBA.updateSellFees(2000, 3000, 500, 200)).to.be.revertedWith('Max fee is 50%')

        } )

        it('Should update Minmum SwapAndLiquidify Amount', async function(){
          await  this.RBA.updateSwapTokensAtAmount(utils.parseEther('1000'))
          expect(await  this.RBA.swapTokensAtAmount()).to.be.equal(utils.parseEther('1000'))

          //reverts
          await expect(this.RBA.updateSwapTokensAtAmount(utils.parseEther('100000000'))).to.be.revertedWith("BattlefieldOfRenegades: Max should be at 10%")

        })
        it.only('Should update Minmum Token Balance', async function(){
            await  this.RBA.updateMinTokenBalance(100000)
            expect(await this.RBAT.minimumTokenBalanceForDividends()).to.be.equal(utils.parseEther('100000'))
        })

        it('Should Update Gas For Processing', async function(){
          expect(await this.RBA.updateGasForProcessing(400000)).to.emit('GasForProcessingUpdated').withArgs('400000','300000')

          //reverts
          await expect(this.RBA.updateGasForProcessing(40000)).to.be.revertedWith("BattlefieldOfRenegades: gasForProcessing must be between 200,000 and 500,000")
          await expect(this.RBA.updateGasForProcessing(1000000)).to.be.revertedWith("BattlefieldOfRenegades: gasForProcessing must be between 200,000 and 500,000")
          //await expect(this.RBA.updateGasForProcessing(300000)).to.be.revertedWith("BattlefieldOfRenegades: gasForProcessing must be between 200,000 and 500,000")
          


        })
      
        it('Should Update Claim wait',async function(){
          expect(await this.RBA.updateClaimWait(7200)).to.emit('ClaimWaitUpdated').withArgs(7200,3600)

          //reverts
          //require(newClaimWait >= 3600 && newClaimWait <= 86400,"BattlefieldOfRenegadesDividendTracker: claimWait must be updated to between 1 and 24 hours"
          await expect(this.RBA.updateClaimWait(2000)).to.be.revertedWith("BattlefieldOfRenegadesDividendTracker: claimWait must be updated to between 1 and 24 hours")
          await expect(this.RBA.updateClaimWait(108000)).to.be.revertedWith("BattlefieldOfRenegadesDividendTracker: claimWait must be updated to between 1 and 24 hours")
        

        })

        it('updateDividendTracker', async function(){
          //deploy a new dividendTracker
          this.RBAT2 = await BattlefieldOfRenegadesDividendTracker.deploy(this.USDC.address, this.RBA.address)
          await this.RBAT2.deployed()
          console.log(`           RBAT2 deployed at: ${this.RBAT2.address}`)
  
           expect( await this.RBA.updateDividendTracker(this.RBAT2.address)).to.emit('UpdateDividendTracker').withArgs(this.RBAT2.address,this.RBAT.address )

           //revert 1:  require(newAddress != address(0), "BattlefieldOfRenegades: Dividend tracker not yet initialized");
           await expect(this.RBA.updateDividendTracker('0x0000000000000000000000000000000000000000')).to.be.revertedWith("BattlefieldOfRenegades: Dividend tracker not yet initialized")
          //revert 2: require(newAddress != address(dividendTracker), "BattlefieldOfRenegades: The dividend tracker already has that address");
           await expect(this.RBA.updateDividendTracker(this.RBAT2.address)).to.be.revertedWith("BattlefieldOfRenegades: The dividend tracker already has that address")
           //revert 3: require(newDividendTracker.getOwner() == address(this),"BattlefieldOfRenegades: The new dividend tracker must be owned by the BattlefieldOfRenegades token contract")
           this.RBAT3 = await BattlefieldOfRenegadesDividendTracker.deploy(this.USDC.address, this.USDC.address)
           await this.RBAT3.deployed()
           console.log(`           RBAT3 deployed at: ${this.RBAT3.address}`)
           await expect(this.RBA.updateDividendTracker(this.RBAT3.address)).to.be.revertedWith("BattlefieldOfRenegades: The new dividend tracker must be owned by the BattlefieldOfRenegades token contract")


        })

        
    })

  })
