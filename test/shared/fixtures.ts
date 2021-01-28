import '@nomiclabs/hardhat-waffle'
import { ethers } from 'hardhat'
import { BigNumber } from 'ethers'
import Transfer from '../../lib/Transfer'
import {
  IFixture,
  IGetMessengerWrapperDefaults,
  CHAIN_IDS,
  RELAYER_FEE,
  TRANSFER_AMOUNT,
  DEFAULT_DEADLINE
} from './constants'
import {
  getMessengerWrapperDefaults
} from './utils'

export async function fixture(l2ChainId: BigNumber): Promise<IFixture> {
  const {
    l2BridgeArtifact,
    messengerWrapperArtifact
  } = getL2SpecificArtifact(l2ChainId)
  const accounts = await ethers.getSigners()
  const [
    user,
    liquidityProvider,
    bonder,
    challenger,
    governance,
    relayer,
    otherAccount
  ] = accounts

  // Factories
  const L1_CanonicalBridge = await ethers.getContractFactory('contracts/test/Mock_L1_CanonicalBridge.sol:Mock_L1_CanonicalBridge')
  const L1_Bridge = await ethers.getContractFactory('contracts/test/Mock_L1_Bridge.sol:Mock_L1_Bridge')
  const L2_Bridge = await ethers.getContractFactory(`contracts/bridges/${l2BridgeArtifact}`)
  const L1_Messenger = await ethers.getContractFactory('contracts/test/Mock_L1_Messenger.sol:Mock_L1_Messenger')
  const MessengerWrapper = await ethers.getContractFactory(`contracts/wrappers/${messengerWrapperArtifact}`)
  const L2_Messenger = await ethers.getContractFactory('contracts/test/Mock_L2_Messenger.sol:Mock_L2_Messenger')
  const UniswapRouter = await ethers.getContractFactory('contracts/uniswap/UniswapV2Router02.sol:UniswapV2Router02')
  const UniswapFactory = await ethers.getContractFactory('@uniswap/v2-core/contracts/UniswapV2Factory.sol:UniswapV2Factory')

  // Mock Factories
  const MockERC20 = await ethers.getContractFactory('contracts/test/MockERC20.sol:MockERC20')
  const MockAccounting = await ethers.getContractFactory('contracts/test/Mock_Accounting.sol:Mock_Accounting')
  const MockBridge = await ethers.getContractFactory('contracts/test/Mock_Bridge.sol:Mock_Bridge')

  // Deploy canonical tokens
  const l1_canonicalToken = await MockERC20.deploy('Dai Stable Token', 'DAI')
  const l2_canonicalToken = await MockERC20.deploy('L2 Dai Stable Token', 'L2DAI')

  // Deploy canonical messengers
  const l1_messenger = await L1_Messenger.deploy(l1_canonicalToken.address)
  const l2_messenger = await L2_Messenger.deploy(l2_canonicalToken.address)

  // Deploy canonical bridges
  const l1_canonicalBridge = await L1_CanonicalBridge.deploy(l1_canonicalToken.address, l1_messenger.address)

  // Deploy Uniswap contracts
  const weth = await MockERC20.deploy('WETH', 'WETH')
  const l2_uniswapFactory = await UniswapFactory.deploy(await user.getAddress())
  const l2_uniswapRouter = await UniswapRouter.deploy(l2_uniswapFactory.address, weth.address)

  // Deploy Hop L1 contracts
  const l1_bridge = await L1_Bridge.deploy(l1_canonicalToken.address, await bonder.getAddress())

  // Deploy Hop L2 contracts
  const l2_bridge = await L2_Bridge.deploy(
    l2_messenger.address,
    governance.getAddress(),
    l2_canonicalToken.address,
    l1_bridge.address,
    [CHAIN_IDS.MAINNET],
    bonder.getAddress(),
    l2_uniswapRouter.address
  )

  // Deploy Messenger Wrapper
  const messengerWrapperDefaults: IGetMessengerWrapperDefaults[] = getMessengerWrapperDefaults(l2ChainId, l1_bridge.address, l2_bridge.address, l1_messenger.address)
  const messengerWrapper = await MessengerWrapper.deploy(...messengerWrapperDefaults)

  // Mocks
  const accounting = await MockAccounting.deploy(await bonder.getAddress())
  const bridge = await MockBridge.deploy(await bonder.getAddress())

  // Transfers
  const transfers: Transfer[] = [
      new Transfer({
        chainId: CHAIN_IDS.ARBITRUM_TESTNET_3,
        sender: await user.getAddress(),
        recipient: await otherAccount.getAddress(),
        amount: TRANSFER_AMOUNT,
        transferNonce: 0,
        relayerFee: RELAYER_FEE,
        amountOutMin: BigNumber.from('0'),
        deadline: BigNumber.from(DEFAULT_DEADLINE)
      }),
      new Transfer({
        chainId: CHAIN_IDS.ARBITRUM_TESTNET_3,
        sender: await liquidityProvider.getAddress(),
        recipient: await liquidityProvider.getAddress(),
        amount: TRANSFER_AMOUNT,
        transferNonce: 0,
        relayerFee: RELAYER_FEE,
        amountOutMin: BigNumber.from('0'),
        deadline: BigNumber.from(DEFAULT_DEADLINE)
      })
    ]

  return {
    accounts,
    user,
    liquidityProvider,
    bonder,
    challenger,
    governance,
    relayer,
    otherAccount,
    L1_CanonicalBridge,
    L1_Bridge,
    L2_Bridge,
    MockERC20,
    MessengerWrapper,
    L1_Messenger,
    L2_Messenger,
    UniswapRouter,
    UniswapFactory,
    MockAccounting,
    MockBridge,
    l1_canonicalToken,
    l1_canonicalBridge,
    l1_messenger,
    messengerWrapper,
    l1_bridge,
    l2_messenger,
    l2_bridge,
    l2_canonicalToken,
    l2_uniswapFactory,
    l2_uniswapRouter,
    accounting,
    bridge,
    transfers
  }
}

const getL2SpecificArtifact = (l2ChainId: BigNumber) => {
  let l2BridgeArtifact: string
  let messengerWrapperArtifact: string

  if (
    l2ChainId === CHAIN_IDS.ARBITRUM_TESTNET_2 ||
    l2ChainId === CHAIN_IDS.ARBITRUM_TESTNET_3
  ) {
    l2BridgeArtifact = 'L2_ArbitrumBridge.sol:L2_ArbitrumBridge'
    messengerWrapperArtifact = 'ArbitrumMessengerWrapper.sol:ArbitrumMessengerWrapper'
  } else if (
    l2ChainId === CHAIN_IDS.OPTIMISM_TESTNET_1 ||
    l2ChainId === CHAIN_IDS.OPTIMISM_SYNTHETIX_DEMO
  ) {
    l2BridgeArtifact = 'L2_OptimismBridge.sol:L2_OptimismBridge'
    messengerWrapperArtifact = 'OptimismMessengerWrapper.sol:OptimismMessengerWrapper'
  }

  return  {
    l2BridgeArtifact,
    messengerWrapperArtifact
  }
}