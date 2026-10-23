import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectCoverflow, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/pagination";

// Coverflow gallery (based on Skiper 49 / Swiper.js), converted to plain JSX.
export default function Carousel({ images, autoplay = false, loop = true }) {
  return (
    <div className="carousel">
      <Swiper
        modules={[EffectCoverflow, Autoplay, Pagination]}
        effect="coverflow"
        grabCursor
        centeredSlides
        slidesPerView="auto"
        loop={loop}
        autoplay={
          autoplay ? { delay: 2500, disableOnInteraction: true } : false
        }
        coverflowEffect={{
          rotate: 40,
          stretch: 0,
          depth: 100,
          modifier: 1,
          slideShadows: true,
        }}
        pagination={{ clickable: true }}
        className="carousel__swiper"
      >
        {images.map((image, i) => (
          <SwiperSlide key={i} className="carousel__slide">
            <img src={image.src} alt={image.alt} loading="lazy" />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}