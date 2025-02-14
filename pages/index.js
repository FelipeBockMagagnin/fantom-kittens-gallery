import { useWeb3React } from "@web3-react/core";
import React from "react";
import { injected } from "../components/wallet/connector";
import axios from "axios";
import KittenGallery from "../components/KittenGallery";
import ConnectWallet from "../components/ConnectWallet";
import Footer from "../components/Footer";
import Link from "next/link";

export default function Home() {
  const [nfts, setNfts] = React.useState([]);
  const [fetchNftsProgress, setFetchNftsProgress] = React.useState(0);

  const { active, account, library, connector, activate, deactivate } =
    useWeb3React();

  async function connect() {
    try {
      await activate(injected, undefined, true);
      postWalletConnection();
    } catch (ex) {
      console.error(ex);
    }
  }

  const postWalletConnection = React.useCallback(async () => {
    setFetchNftsProgress(10);
    const result = await axios.get(
      `https://api.paintswap.finance/userNFTs/${account}`,
      {
        params: {
          allowNSFW: true,
          numToFetch: 10,
          numToSkip: 0,
        },
      }
    );

    if (result.data.nfts.length > 0) {
      const { nfts } = result.data;
      const tmpNfts = nfts
        .filter(
          ({ nft }) =>
            nft.address.toLowerCase() ==
            "0xfd211f3b016a75bc8d73550ac5adc2f1cae780c0"
        )
        .sort(({ nft: nftA }, { nft: nftB }) => {
          const nNftA = Number(nftA.tokenId);
          const nNftB = Number(nftB.tokenId);
          if (nNftA > nNftB) return +1;
          else if (nNftA < nNftB) return -1;
          return 0;
        })
        .map(({ nft }) => nft);

      setFetchNftsProgress(60);
      for (let nft of tmpNfts) {
        const { data: fakeKitten } = await axios.get(
          `https://kittens.fakeworms.studio/api/kitten/${nft.tokenId}`
        );
        nft.imageUrl = fakeKitten.image;
        nft.name = fakeKitten.name;
        nft.attributes = fakeKitten.attributes;
      }
      setFetchNftsProgress(100);
      setNfts(tmpNfts);
    }
  }, [account]);

  React.useEffect(() => {
    if (account !== undefined) postWalletConnection();
    else setNfts([]);
  }, [account, postWalletConnection]);

  async function disconnect() {
    try {
      deactivate();
      setFetchNftsProgress(0);
    } catch (ex) {
      console.log(ex);
    }
  }

  return (
    <>
      <div className="flex flex-col items-center justify-center min-h-screen">
        {nfts.length > 0 ? null : (
          <div className="nes-container with-title max-w-full md:max-w-2xl mx-3">
            <span className="title">About</span>
            <p>
              By now, this is just a gallery to see your{" "}
              <a
                href="https://kittens.fakeworms.studio/"
                target="_blank"
                rel="noreferrer"
                className="nes-text is-primary"
              >
                Fantom Kittens
              </a>{" "}
              made by{" "}
              <a
                href="https://twitter.com/FakewormsStudio"
                target="_blank"
                rel="noreferrer"
                className="nes-text is-primary"
              >
                FakeWorms Studio
              </a>
              .
            </p>
          </div>
        )}
        <div className="nes-container with-title md:w-3/6 mt-10 mx-3">
          <span className="title">Wallet</span>
          <ConnectWallet
            account={account}
            connect={connect}
            disconnect={disconnect}
          />
        </div>
        <div className="nes-container with-title md:w-3/6 mt-10 mx-3">
          <span className="title">Rarity Rank</span>
          <Link href="/rarity-rank">
            <a className="nes-btn is-primary">See rarity rank</a>
          </Link>
        </div>
        {nfts.length > 0 || fetchNftsProgress === 0 ? null : (
          <div className="nes-container with-title md:w-3/6 mt-3">
            <span className="title">Loading...</span>
            <progress
              className="nes-progress is-success"
              value={fetchNftsProgress}
              max="100"
            ></progress>
          </div>
        )}
        <KittenGallery nfts={nfts} />
      </div>
      <Footer />
    </>
  );
}
