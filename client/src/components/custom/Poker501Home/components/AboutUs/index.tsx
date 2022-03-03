import React, { memo, useState, useRef } from "react";
import Slider from "react-slick";
import "../../../../../../node_modules/slick-carousel/slick/slick.css";
import "../../../../../../node_modules/slick-carousel/slick/slick-theme.css";
import "./styles.css";
import ReactPlayer from "react-player";

const settings = {
  centerMode: true,
  slidesToShow: 1,
  slidesToScroll: 1,
  infinite: true,
  cssEase: "linear",
  variableWidth: true,
  variableHeight: true,
  swipe: false,
  arrows: false,
  speed: 300,
};

const AboutUsComponent = () => {
  const slider = useRef<Slider>(null);
  const [isVideoPlaying, setVideoPlaying] = useState(false);

  const video = document.createElement("video");
  const supportsWebm = video.canPlayType("video/webm; codecs=\"vp8, vorbis\"");
  const ext = supportsWebm ? "webm" : "mp4";

  const handlePlayVideo = () => setVideoPlaying(!isVideoPlaying);

  const nextSlider = () => {
    slider.current.slickNext();
  }
  const previousSlide = () => {
    slider.current.slickPrev();
  }

  return (
    <section className="about-us-section" id="about-us">
      <div className="about-us-section__header wrapper">
        <p className="about-us-section__title">About Us</p>
        <div className="about-us-section__arrows">
          <button className="arrow-left arrow" onClick={previousSlide}>
            <img
              className="icon"
              src="/custom/poker501.com/slider-arrow-left.png"
              alt="arrow-icon"
            />
          </button>
          <button className="arrow-right arrow" onClick={nextSlider}>
            <img
              className="icon"
              src="/custom/poker501.com/slider-arrow-right.png"
              alt="arrow-icon"
            />
          </button>
        </div>
      </div>
      <div className="about-us-section__slider">
        <Slider {...settings} ref={el => slider.current = el}>
          <div>
            <div className="slide-item second-slide">
              <div className="slide-wrap">
                <p className="slide-title">Our end-to-end execution includes:</p>
                <ul className="slide-list">
                  <li className="slide-list-item">
                    <p className="list-item-description">Implementation of intro program to welcome participants and share key messaging</p>
                  </li>
                  <li className="slide-list-item">
                    <p className="list-item-description">Brand integration</p>
                  </li>
                  <li className="slide-list-item">
                    <p className="list-item-description">Custom digital invitation templates to invite guests</p>
                  </li>
                  <li className="slide-list-item">
                    <p className="list-item-description">Registration website build</p>
                  </li>
                  <li className="slide-list-item">
                    <p className="list-item-description">Participant communication copy/content</p>
                  </li>
                  <li className="slide-list-item">
                    <p className="list-item-description">Run-of-show and programming support</p>
                  </li>
                  <li className="slide-list-item">
                    <p className="list-item-description">Live tech support for participants</p>
                  </li>
                  <li className="slide-list-item">
                    <p className="list-item-description">Food & beverage kits delivered to participants</p>
                  </li>
                  <li className="slide-list-item">
                    <p className="list-item-description">Celebrity appearances</p>
                  </li>
                  <li className="slide-list-item">
                    <p className="list-item-description">Non-cash prizes</p>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div>
            <div className="slide-item first-slide">
              <div className="slide-wrap" onClick={handlePlayVideo}>
                {!isVideoPlaying && (<>
                  <button className="play-button" onClick={handlePlayVideo} />
                  <div className="overlay" />
                </>)}

                <img
                  src="/custom/poker501.com/poker501_logo-reverse.png"
                  alt="img - Poker501"
                  className="logo-img"
                />

                <ReactPlayer
                  controls={false}
                  width="100%"
                  height={500}
                  loop
                  playing={isVideoPlaying}
                  url={`/custom/poker501.com/table-players.min.${ext}`}
                />
              </div>
            </div>
          </div>
          <div>
            <div className="slide-item third-slide">
              <div className="slide-wrap">
                <ReactPlayer
                  controls={false}
                  width="100%"
                  height={500}
                  url="https://www.youtube.com/watch?v=PXcGRjTWnAQ"
                />
              </div>
            </div>
          </div>
        </Slider>
      </div>
    </section>
  );
};

export const AboutUs = memo(AboutUsComponent);