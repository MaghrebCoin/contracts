// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "../interfaces/xDai/messengers/IArbitraryMessageBridge.sol";
import "./L2_Connector.sol";

contract L2_XDaiConnector is L2_Connector {
    IArbitraryMessageBridge public messenger;
    /// @notice The xDai AMB uses bytes32 for chainId instead of uint256
    bytes32 public immutable l1ChainId;
    uint256 public defaultGasLimit;

    constructor (
        address _l1Address,
        address _l2Address,
        IArbitraryMessageBridge _messenger,
        uint256 _l1ChainId,
        uint256 _defaultGasLimit
    )
        public
        L2_Connector(
            _l1Address,
            _l2Address
        )
    {
        messenger = _messenger;
        l1ChainId = bytes32(_l1ChainId);
        defaultGasLimit = _defaultGasLimit;
    }

    /* ========== Override Functions ========== */

    function _forwardCrossDomainMessage() internal override {
        messenger.requireToPassMessage(
            l1Address,
            msg.data,
            defaultGasLimit
        );
    }

    function _verifySender() internal override {
        require(messenger.messageSender() == l1Address, "L2_XDAI_CNR: Invalid cross-domain sender");
        require(msg.sender == address(messenger), "L2_XDAI_CNR: Caller is not the expected sender");

        // With the xDai AMB, it is best practice to also check the source chainId
        // https://docs.tokenbridge.net/amb-bridge/how-to-develop-xchain-apps-by-amb#receive-a-method-call-from-the-amb-bridge
        require(messenger.messageSourceChainId() == l1ChainId, "L2_XDAI_CNR: Invalid source Chain ID");
    }
}