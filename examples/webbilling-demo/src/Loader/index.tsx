import React, { useEffect, useState } from "react";

import cat from "./nyan-cat.gif";

const randomSentences = [
  "Asking ChatGPT to feed our crypto-cats",
  "Cleaning the cat litter in the meta-verse",
  "Preparing the automated laser pointers",
  "Uselessly calculating 1000 Fibonacci numbers",
];

const getRandomSentence = () => {
  return randomSentences[Math.floor(Math.random() * randomSentences.length)];
};

const Loader: React.FC = () => {
  const [sentence, setSentence] = useState(getRandomSentence());
  useEffect(() => {
    setTimeout(() => {
      setSentence(getRandomSentence());
    }, 3000);
  }, []);

  return (
    <div
      className={"card"}
      style={{ background: "#014379", maxWidth: "300px", padding: "0px" }}
    >
      <div style={{ height: "50px", background: "black" }}>
        <h4 style={{ marginTop: "0", paddingTop: "10px" }}>Loading...</h4>
      </div>
      <img src={cat} style={{ maxWidth: "300px" }} alt={"Loading..."} />
      <div style={{ height: "70px", background: "black" }}>
        <h4 style={{ marginTop: "0", paddingTop: "10px" }}>{sentence}</h4>
      </div>
    </div>
  );
};

export default Loader;

export const FullPageLoader: React.FC = () => {
  return (
    <div
      style={{
        background: "rgba(0,0,0,0.6)",
        zIndex: 999,
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          margin: "auto",
        }}
      >
        <Loader />
      </div>
    </div>
  );
};
