import React, { useEffect, useState } from "react";

import { Body, Button, Container, Header, Image, Link } from "./components";
import logo from "./ethereumLogo.png";

import { addresses, abis } from "@my-app/contracts";
import { formatEther, shortenAddress } from "./utils";
import Web3 from "web3";

function WalletButton({ account, ...rest }) {
  const [rendered, setRendered] = useState("");

  useEffect(() => {
    account ? setRendered(shortenAddress(account)) : setRendered("");
  }, [account]);

  return (
    <Button {...rest}>
      {rendered === "" && "Connect Wallet"}
      {rendered !== "" && rendered}
    </Button>
  );
}

function App() {
  const [account, setAccount] = useState("");
  const [sushiBalance, setSushiBalance] = useState("0");
  const [ethBalance, setEthBalance] = useState("0");

  const [pending, setPending] = useState("0");
  const [staked, setStaked] = useState("0");

  const web3 = new Web3(window.ethereum);
  const sushiToken = new web3.eth.Contract(abis.erc20, addresses.sushiToken, {
    from: account,
  });
  const wallet = new web3.eth.Contract(abis.wallet, addresses.sushiWallet, {
    from: account,
  });

  useEffect(() => {
    if (account) {
      sushiToken.methods
        .balanceOf(account)
        .call()
        .then((res) => setSushiBalance(formatEther(res)));

      web3.eth
        .getBalance(account)
        .then((res) => setEthBalance(formatEther(res)));

      wallet.methods
        .pending(0)
        .call()
        .then((res) => setPending(formatEther(res)));

      wallet.methods
        .staked(0)
        .call()
        .then((res) => setStaked(formatEther(res)));
    } else {
      setEthBalance("0");
      setSushiBalance("0");
    }
  }, [account]);

  window.ethereum.on("accountsChanged", function (accounts) {
    // Time to reload your interface with accounts[0]!
    console.log("account changed!");
    setAccount(accounts[0]);
  });

  const handleWaletBtnClick = () => {
    if (!account) {
      window.ethereum
        .request({ method: "eth_requestAccounts" })
        .then((res) => setAccount(res[0]))
        .catch((err) => console.log(err.message));
    } else {
      setAccount("");
    }

    console.log(window.ethereum.selectedAddress);
  };

  const approveTokens = async (token, spender, amount) => {
    const res = await token.methods.approve(spender, amount).send();
    return res;
  };

  const deposit = async () => {
    const amounts = [
      web3.utils.toWei(document.getElementById("deposit-amount-a").value),
    ];
    const ethAmount = web3.utils.toWei(
      document.getElementById("deposit-amount-b").value
    );

    const allowance = web3.utils.toBN(
      await sushiToken.methods.allowance(account, wallet.options.address).call()
    );

    if (!allowance.gte(web3.utils.toBN(amounts[0])))
      await approveTokens(
        sushiToken,
        wallet.options.address,
        web3.utils.toBN(amounts[0]).sub(allowance)
      );

    await wallet.methods
      .deposit([addresses.sushiToken], amounts, 0, 0, 0)
      .send({ value: ethAmount });
  };

  return (
    <Container>
      <Header>
        SUSHI Balance:&nbsp;{" "}
        <span style={{ color: "red" }}>{sushiBalance}</span>&nbsp; ETH
        Balance:&nbsp; <span style={{ color: "red" }}>{ethBalance}</span>
        <WalletButton account={account} onClick={handleWaletBtnClick} />
      </Header>
      <Body>
        <Image src={logo} alt="ethereum-logo" />
        <div>
          <h2>Sushi Wallet</h2>
        </div>
        <div>
          Pending SUSHI: <span style={{ color: "red" }}>{pending}</span>
          &nbsp; Staked LPs: <span style={{ color: "red" }}>{staked}</span>
        </div>
        <div style={{ marginTop: 25, fontSize: 20 }}>
          Deposit: &nbsp;
          <input id="deposit-amount-a" placeholder="amountA" />
          <input id="deposit-amount-b" placeholder="amountB" />
          <Button
            onClick={deposit}
            style={{ color: "white", backgroundColor: "#085157" }}
          >
            deposit
          </Button>
        </div>
      </Body>
    </Container>
  );
}

export default App;
