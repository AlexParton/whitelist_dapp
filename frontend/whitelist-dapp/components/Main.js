import Image from 'next/image'
import classes from '../styles/Home.module.css';
import Web3Modal from "web3modal";
import { providers, Contract } from "ethers";
import { useEffect, useRef, useState } from 'react';
import { abi, WHITELIST_CONTRACT_ADDRESS } from '../constants';

const Main = () => {
  const [walletConnected, setWalletConnected] = useState(false);
  const [numOfWhitelisted, setNumOfWhitelisted] = useState(0);
  const [joinedWhitelist, setJoinedWhitelist] = useState(false);
  const [loading, setLoading] = useState(false);
  const web3ModalRef = useRef();

  const getProviderOrSigner = async (needSigner = false) => {
    try {
      const provider = await web3ModalRef.current.connect();
      const web3Provider = new providers.Web3Provider(provider);
      
      const { chainId } = await web3Provider.getNetwork()
      if (chainId !== 5) {
        window.alert('Change network to Goerli');
        throw new Error("Change network to Goerli");
      }

      if (needSigner) {
        const signer = web3Provider.getSigner();
        return signer;
      }

      return web3Provider
    } catch(error) {
      console.log({error})
    }
  }

  const checkIfAddressIsWhitelisted = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const whitelistContract = new Contract(
        WHITELIST_CONTRACT_ADDRESS,
        abi,
        signer
      );
      const address = await signer.getAddress();
      const _joinedWhitelist = await whitelistContract.whitelistedAddresses(
        address
      );
      setJoinedWhitelist(_joinedWhitelist)  

    } catch (error) {
      console.log({error})
    }
  }

  const getNumberOfWhitelisted = async () => {
    try {
      const provider = await getProviderOrSigner();
      const whitelistContract = new Contract(
        WHITELIST_CONTRACT_ADDRESS,
        abi,
        provider
      );
      const _numOfWhitelisted = await whitelistContract.numAddressesWhitelisted();
      setNumOfWhitelisted(_numOfWhitelisted);
    } catch (error) {
      console.log({error})
    }
  }

  const addAddressToWhitelist = async () => {
    const signer = await getProviderOrSigner(true);
    const whitelistContract = new Contract(
      WHITELIST_CONTRACT_ADDRESS,
      abi,
      signer
    );
    const tx = await whitelistContract.addAddressToWhitelist();
    setLoading(true);
    await tx.wait();
    setLoading(false);
    await getNumberOfWhitelisted();
    setJoinedWhitelist(true)
  }

  const renderButton = () => {
    if (loading) return <button className={classes.button}>Loading...</button>
    if (walletConnected) {
      if (joinedWhitelist) {
        return (
          <div className={classes.description}>Thanks for joining the whitelist!</div>
        )
      }

      return (
        <button className={classes.button} onClick={addAddressToWhitelist}>Join the Whitelist</button>
      )
    }

    return  <button className={classes.button} onClick={connectWallet}>Connect Wallet</button>
  }

  const connectWallet = async () => {
    try {
      await getProviderOrSigner();
      setWalletConnected(true);
      checkIfAddressIsWhitelisted();
      getNumberOfWhitelisted();
    } catch(error) {
      console.log({error})
    }
  }

  useEffect(() => {
    if(!walletConnected) {
      web3ModalRef.current = new Web3Modal({
        network: "goerli",
        providerOptions: {},
        disableInjectedProvider: false
      });
      connectWallet()
    }
  }, [walletConnected])

  return ( 
    <main className={classes.main}>
      <div>
        <h1 className={classes.title}>Welcome to Crypto Devs!</h1>
        <div className={classes.description}>
          {numOfWhitelisted} have already joined the Whitelist.
        </div>
        {renderButton()}
      </div>
     
      <div className={classes.image}>
          <Image 
           src='/crypto-devs.svg' 
           width={500} 
           height={500} 
           className={classes.image}
           alt="a person in a computer"
           priority
          />
      </div>
    </main>
   );
}
 
export default Main;