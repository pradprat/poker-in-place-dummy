import React, { useState, useEffect } from "react";

import AudioVisualizer from "./AudioVisualizer";

interface IProps {
  audio: any;
}

export default function AudioAnalyzer(props: IProps) {
  const [audioData, setAudioData] = useState<Uint8Array>(new Uint8Array(0));

  const [audioContext] = useState(
    new (window.AudioContext || window.webkitAudioContext)()
  );
  const [analyzer] = useState(audioContext.createAnalyser());
  const [source] = useState(audioContext.createMediaStreamSource(props.audio));
  const [dataArray] = useState(new Uint8Array(analyzer.frequencyBinCount));
  const [rafId, setRafID] = useState<number>();

  const tick = () => {
    analyzer.getByteTimeDomainData(dataArray);
    setAudioData(dataArray);
    const _rafId = requestAnimationFrame(tick);
    setRafID(_rafId);
  };

  useEffect(() => {
    const _rafId = requestAnimationFrame(tick);
    setRafID(_rafId);
    source.connect(analyzer);
    return () => {
      cancelAnimationFrame(rafId);
      analyzer.disconnect();
      source.disconnect();
    };
  }, [audioContext, analyzer, source]);

  return <AudioVisualizer audioData={audioData} />;
}
