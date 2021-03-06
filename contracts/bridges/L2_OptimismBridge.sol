// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;

import "../interfaces/optimism/messengers/iOVM_L2CrossDomainMessenger.sol";
import "./L2_Bridge.sol";

contract L2_OptimismBridge is L2_Bridge {
    iOVM_L2CrossDomainMessenger public messenger;
    uint32 public defaultGasLimit;

    constructor (
        iOVM_L2CrossDomainMessenger _messenger,
        address l1Governance,
        HopBridgeToken hToken,
        IERC20 l2CanonicalToken,
        address l1BridgeAddress,
        uint256[] memory supportedChainIds,
        address[] memory bonders,
        uint32 _defaultGasLimit
    )
        public
        L2_Bridge(
            l1Governance,
            hToken,
            l2CanonicalToken,
            l1BridgeAddress,
            supportedChainIds,
            bonders
        )
    {
        messenger = _messenger;
        defaultGasLimit = _defaultGasLimit;
    }

    // TODO: Use a valid gasLimit
    function _sendCrossDomainMessage(bytes memory message) internal override {
        messenger.sendMessage(
            l1BridgeAddress,
            message,
            defaultGasLimit
        );
    }

    function _verifySender(address expectedSender) internal override {
        // require(msg.sender == address(messenger), "OVM_MSG_WPR: Caller is not l1MessengerAddress");
        // Verify that cross-domain sender is expectedSender
        // require(messenger.xDomainMessageSender() == expectedSender, "OVM_MSG_WPR: Invalid cross-domain sender");
    }
}
